import useSWR from "swr";

// Simple type for our filters
type Filters = {
	leagues: string[];
	teams: string[];
};

const FILTER_KEY = "sports-calendar-filters";

/**
 * Simple hook for managing filter state
 */
export function useFilters() {
	const { data, mutate } = useSWR<Filters>(FILTER_KEY, {
		fallbackData: { leagues: [], teams: [] },
	});

	// Ensure data is always defined using the fallback
	const filters = data || { leagues: [], teams: [] };

	/**
	 * Toggle a league filter
	 */
	const toggleLeague = (leagueId: string) => {
		const isSelected = filters.leagues.includes(leagueId);

		if (isSelected) {
			// Remove if already selected
			mutate({
				...filters,
				leagues: filters.leagues.filter((id) => id !== leagueId),
			});
		} else {
			// Add if not selected
			mutate({
				...filters,
				leagues: [...filters.leagues, leagueId],
			});
		}
	};

	/**
	 * Toggle a team filter
	 */
	const toggleTeam = (teamId: string) => {
		const isSelected = filters.teams.includes(teamId);

		if (isSelected) {
			// Remove if already selected
			mutate({
				...filters,
				teams: filters.teams.filter((id) => id !== teamId),
			});
		} else {
			// Add if not selected
			mutate({
				...filters,
				teams: [...filters.teams, teamId],
			});
		}
	};

	/**
	 * Reset all filters
	 */
	const resetFilters = () => {
		mutate({ leagues: [], teams: [] });
	};

	return {
		filters,
		toggleLeague,
		toggleTeam,
		resetFilters,

		// Helper getters for component logic
		hasFilters: filters.leagues.length > 0 || filters.teams.length > 0,
		leagueCount: filters.leagues.length,
		teamCount: filters.teams.length,
	};
}
