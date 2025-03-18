"use server";

import { unstable_cache } from "next/cache";

// Define the favorites object at module level so it's not recreated on each function call
const favorites = {
	leagues: [
		{ sportId: "soccer", leagueId: "uefa.champions" },
		{ sportId: "soccer", leagueId: "uefa.wchampions" },
		{ sportId: "soccer", leagueId: "usa.1" },
		{ sportId: "soccer", leagueId: "usa.open" },
		{ sportId: "soccer", leagueId: "concacaf.leagues.cup" },
		{ sportId: "soccer", leagueId: "concacaf.champions" },
		{ sportId: "soccer", leagueId: "usa.ncaa.w.1" },
		{ sportId: "soccer", leagueId: "eng.1" },
		{ sportId: "soccer", leagueId: "esp.w.1" },
		{ sportId: "soccer", leagueId: "eng.fa" },
		{ sportId: "soccer", leagueId: "eng.w.1" },
		{ sportId: "soccer", leagueId: "eng.w.fa" },
		{ sportId: "soccer", leagueId: "ger.1" },
		{ sportId: "soccer", leagueId: "aut.1" },
		{ sportId: "basketball", leagueId: "mens-college-basketball" },
		{ sportId: "basketball", leagueId: "womens-college-basketball" },
		{ sportId: "football", leagueId: "college-football" },
		{ sportId: "football", leagueId: "nfl" },
	],
};

// Cache league data to avoid repeated API calls
const getLeagueData = unstable_cache(
	async (sportId: string, leagueId: string) => {
		try {
			const response = await fetch(
				`https://sports.core.api.espn.com/v2/sports/${sportId}/leagues/${leagueId}?lang=en&region=us`,
				{ next: { revalidate: 86400 } } // Cache for 24 hours
			);
			return await response.json();
		} catch (error) {
			console.error(`Error fetching league data for ${sportId}/${leagueId}:`, error);
			return { name: "Unknown League", abbreviation: "" };
		}
	},
	["league-data"],
	{ revalidate: 86400 } // Cache for 24 hours
);

// Cache events for a specific date, sport and league
const getEventsForDate = unstable_cache(
	async (sportId: string, leagueId: string, formattedDate: string) => {
		try {
			const response = await fetch(
				`https://site.api.espn.com/apis/site/v2/sports/${sportId}/${leagueId}/scoreboard?dates=${formattedDate}&limit=100`,
				{ next: { revalidate: 3600 } } // Cache for 1 hour
			);
			const data = await response.json();
			return data.events || [];
		} catch (error) {
			console.error(`Error fetching events for ${sportId}/${leagueId} on ${formattedDate}:`, error);
			return [];
		}
	},
	["events-data"],
	{ revalidate: 3600 } // Cache for 1 hour
);

// Get all leagues for filtering
export async function getLeagues() {
	const leagueData = await Promise.all(
		favorites.leagues.map(async ({ sportId, leagueId }) => {
			const data = await getLeagueData(sportId, leagueId);
			return {
				id: leagueId,
				sportId,
				name: data.name || "Unknown League",
				abbreviation: data.abbreviation || "",
			};
		})
	);

	return leagueData;
}

// Main function to fetch events data
export async function fetchEventsData(monthOffset = 0, activeLeagues: string[] | null = null) {
	// Get target month with offset
	const today = new Date();
	const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
	const targetMonth = targetDate.getMonth();
	const targetYear = targetDate.getFullYear();
	const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

	// Filter leagues if activeLeagues is provided
	const leaguesToFetch = activeLeagues
		? favorites.leagues.filter((league) => activeLeagues.includes(`${league.sportId}-${league.leagueId}`))
		: favorites.leagues;

	// Process each league in parallel
	const leaguePromises = leaguesToFetch.map(async ({ sportId, leagueId }) => {
		try {
			// Get league data
			const leagueData = await getLeagueData(sportId, leagueId);
			const leagueName = leagueData.name || "Unknown League";
			const leagueAbbreviation = leagueData.abbreviation || "";

			// Create date promises for this league
			const datePromises = [];

			// Batch days into weeks to reduce parallel requests
			for (let day = 1; day <= daysInMonth; day += 7) {
				const batchPromises = [];

				// Process up to 7 days in a batch
				for (let i = 0; i < 7 && day + i <= daysInMonth; i++) {
					const currentDay = day + i;
					const date = new Date(targetYear, targetMonth, currentDay);
					const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

					batchPromises.push(
						getEventsForDate(sportId, leagueId, formattedDate).then((events) => {
							return events.map((event) => ({
								id: event.id,
								date: new Date(event.date),
								name: event.name,
								completed: event.status?.type?.completed || false,
								shortName: event.shortName || "",
								league: leagueName,
								leagueAbbreviation: leagueAbbreviation,
								sportId: sportId,
								leagueId: leagueId,
								network: event.competitions?.[0]?.broadcasts?.[0]?.names?.join(", ") || null,
								venue: event.competitions?.[0]?.venue?.fullName || "",
								homeTeam: event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "home")?.team || {},
								awayTeam: event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "away")?.team || {},
								homeScore: event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "home")?.score || "",
								awayScore: event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "away")?.score || "",
							}));
						})
					);
				}

				// Process each batch sequentially to avoid too many parallel requests
				datePromises.push(Promise.all(batchPromises).then((results) => results.flat()));
			}

			// Wait for all date batches to complete
			const allBatchResults = await Promise.all(datePromises);
			return allBatchResults.flat();
		} catch (error) {
			console.error(`Error processing league ${sportId}/${leagueId}:`, error);
			return [];
		}
	});

	// Wait for all leagues to be processed
	const leagueResults = await Promise.all(leaguePromises);

	// Combine all events
	return leagueResults.flat();
}
