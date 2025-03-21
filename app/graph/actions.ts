"use server";

import { unstable_cache } from "next/cache";
import { Event, League } from "@/types";

// Simple list of leagues we care about
const LEAGUES = [
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
];

// Cache league data
const getLeagueData = unstable_cache(
	async (sportId: string, leagueId: string) => {
		try {
			const response = await fetch(`https://sports.core.api.espn.com/v2/sports/${sportId}/leagues/${leagueId}?lang=en&region=us`, {
				next: { revalidate: 86400 },
			});

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
	{ revalidate: 86400 }
);

// Cache events for a specific date
const getEventsForDate = unstable_cache(
	async (sportId: string, leagueId: string, formattedDate: string) => {
		try {
			const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportId}/${leagueId}/scoreboard?dates=${formattedDate}&limit=100`, {
				next: { revalidate: 3600 },
			});

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
	{ revalidate: 3600 }
);

/**
 * Fetches all leagues
 */
export async function getLeagues(): Promise<League[]> {
	const leagueData = await Promise.all(
		LEAGUES.map(async ({ sportId, leagueId }) => {
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

/**
 * Fetches all events for all leagues for a specific month
 * @param monthOffset Number of months from current month (0 = current)
 */
export async function fetchEventsData(monthOffset = 0): Promise<Event[]> {
	// Get target month with offset
	const today = new Date();
	const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
	const targetMonth = targetDate.getMonth();
	const targetYear = targetDate.getFullYear();
	const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

	// Create formatted dates for the month
	const formattedDates: string[] = [];
	for (let day = 1; day <= daysInMonth; day++) {
		const formattedDate = `${targetYear}${String(targetMonth + 1).padStart(2, "0")}${String(day).padStart(2, "0")}`;
		formattedDates.push(formattedDate);
	}

	// Fetch all events for all leagues for all dates
	const allEvents: Event[] = [];

	// Process leagues in batches of 5 to balance parallelism with resource usage
	const batchSize = 5;
	for (let i = 0; i < LEAGUES.length; i += batchSize) {
		const batch = LEAGUES.slice(i, i + batchSize);

		const batchResults = await Promise.all(
			batch.map(async ({ sportId, leagueId }) => {
				try {
					// Get league data
					const leagueData = await getLeagueData(sportId, leagueId);
					const leagueName = leagueData.name || "Unknown League";
					const leagueAbbreviation = leagueData.abbreviation || "";

					const leagueEvents: Event[] = [];

					// Process each date
					for (const formattedDate of formattedDates) {
						const events = await getEventsForDate(sportId, leagueId, formattedDate);

						// Process events
						const processedEvents = events.map(
							(event: any): Event => ({
								id: event.id,
								date: new Date(event.date),
								name: event.name,
								completed: event.status?.type?.completed || false,
								shortName: event.shortName || "",
								league: leagueName,
								leagueAbbreviation,
								sportId,
								leagueId,
								network: event.competitions?.[0]?.broadcasts?.[0]?.names?.join(", ") || null,
								venue: event.competitions?.[0]?.venue?.fullName || "",
								homeTeam: {
									id: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.id || "",
									displayName:
										event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "Unknown Team",
									abbreviation: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.abbreviation,
									logo: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.logo,
									color: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.color,
									alternateColor: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.team?.alternateColor,
								},
								awayTeam: {
									id: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.id || "",
									displayName:
										event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "Unknown Team",
									abbreviation: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.abbreviation,
									logo: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.logo,
									color: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.color,
									alternateColor: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.team?.alternateColor,
								},
								homeScore: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.score || "",
								awayScore: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.score || "",
							})
						);

						leagueEvents.push(...processedEvents);
					}

					return leagueEvents;
				} catch (error) {
					console.error(`Error processing league ${sportId}/${leagueId}:`, error);
					return [];
				}
			})
		);

		// Combine batch results
		batchResults.forEach((events) => {
			allEvents.push(...events);
		});
	}

	return allEvents;
}
