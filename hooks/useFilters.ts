import useSWR, { mutate } from "swr";
import { FilterState } from "@/types";

const FILTER_KEY = "state:event-filters";

export function useFilters() {
	const { data: filters, mutate: setFilters } = useSWR<FilterState>(FILTER_KEY, {
		fallbackData: {
			selectedLeagues: null,
			selectedTeams: null,
		},
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	const toggleLeague = (leagueId: string) => {
		if (!filters) return;

		setFilters((prev) => {
			if (!prev) return prev;

			// If null (all leagues selected), set to just this league
			if (prev.selectedLeagues === null) {
				return { ...prev, selectedLeagues: [leagueId] };
			}

			// If selectedLeagues is undefined, initialize it with this league
			if (!prev.selectedLeagues) {
				return { ...prev, selectedLeagues: [leagueId] };
			}

			// If this league is already selected
			if (prev.selectedLeagues.includes(leagueId)) {
				// If it's the only one selected, clear selection (show all)
				if (prev.selectedLeagues.length === 1) {
					return { ...prev, selectedLeagues: null };
				}
				// Otherwise remove it from selection
				return {
					...prev,
					selectedLeagues: prev.selectedLeagues.filter((id) => id !== leagueId),
				};
			}

			// Add this league to selection
			return {
				...prev,
				selectedLeagues: [...prev.selectedLeagues, leagueId],
			};
		}, false);
	};

	const toggleTeam = (teamId: string) => {
		if (!filters) return;

		setFilters((prev) => {
			if (!prev) return prev;

			// If null (all teams selected), set to just this team
			if (prev.selectedTeams === null) {
				return { ...prev, selectedTeams: [teamId] };
			}

			// If this team is already selected
			if (prev.selectedTeams.includes(teamId)) {
				// If it's the only one selected, clear selection (show all)
				if (prev.selectedTeams.length === 1) {
					return { ...prev, selectedTeams: null };
				}
				// Otherwise remove it from selection
				return {
					...prev,
					selectedTeams: prev.selectedTeams.filter((id) => id !== teamId),
				};
			}

			// Add this team to selection
			return {
				...prev,
				selectedTeams: [...prev.selectedTeams, teamId],
			};
		}, false);
	};

	const resetTeamFilters = () => {
		setFilters(
			(prev) => ({
				...prev!,
				selectedTeams: null,
			}),
			false
		);
	};

	const resetFilters = () => {
		setFilters(
			{
				selectedLeagues: null,
				selectedTeams: null,
			},
			false
		);
	};

	return {
		filters,
		toggleLeague,
		toggleTeam,
		resetTeamFilters,
		resetFilters,
	};
}

export const mutateFilters = (newFilters: FilterState) => {
	mutate(FILTER_KEY, newFilters);
};
