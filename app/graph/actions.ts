"use server";

import { unstable_cache } from "next/cache";
import { Event, League, LeagueFilter } from "@/types";

// Define the favorites object at module level
const favorites: { leagues: LeagueFilter[] } = {
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
		{ sportId: "baseball", leagueId: "college-baseball" },
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

			if (!response.ok) {
				throw new Error(`Failed to fetch league data: ${response.status}`);
			}

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

			if (!response.ok) {
				throw new Error(`Failed to fetch events: ${response.status}`);
			}

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
export async function getLeagues(): Promise<League[]> {
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

// Optimized function to fetch events data with batching
export async function fetchEventsData(monthOffset = 0, activeLeagues: string[] | null = null): Promise<Event[]> {
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

	// Create a map of all dates in the month - use a more efficient format
	const formattedDates: string[] = [];
	for (let day = 1; day <= daysInMonth; day++) {
		const formattedDate = `${targetYear}${String(targetMonth + 1).padStart(2, "0")}${String(day).padStart(2, "0")}`;
		formattedDates.push(formattedDate);
	}

	// Create batches of dates to reduce API calls
	const batchSize = 7; // One week at a time
	const dateBatches: string[][] = [];
	for (let i = 0; i < formattedDates.length; i += batchSize) {
		dateBatches.push(formattedDates.slice(i, i + batchSize));
	}

	// Process each league with controlled concurrency
	const concurrencyLimit = 3; // Process 3 leagues at a time to avoid rate limiting
	const allEvents: Event[] = [];

	// Process leagues in batches to control concurrency
	for (let i = 0; i < leaguesToFetch.length; i += concurrencyLimit) {
		const leagueBatch = leaguesToFetch.slice(i, i + concurrencyLimit);

		const leagueBatchResults = await Promise.all(
			leagueBatch.map(async ({ sportId, leagueId }) => {
				try {
					// Get league data
					const leagueData = await getLeagueData(sportId, leagueId);
					const leagueName = leagueData.name || "Unknown League";
					const leagueAbbreviation = leagueData.abbreviation || "";

					const leagueEvents: Event[] = [];

					// Process date batches sequentially
					for (const dateBatch of dateBatches) {
						const batchResults = await Promise.all(dateBatch.map((formattedDate) => getEventsForDate(sportId, leagueId, formattedDate)));

						// Process events from this batch
						for (const events of batchResults) {
							const processedEvents = events.map((event) => ({
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

							leagueEvents.push(...processedEvents);
						}
					}

					return leagueEvents;
				} catch (error) {
					console.error(`Error processing league ${sportId}/${leagueId}:`, error);
					return [];
				}
			})
		);

		// Add all events from this batch of leagues
		allEvents.push(...leagueBatchResults.flat());
	}

	return allEvents;
}
