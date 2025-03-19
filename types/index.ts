export interface Team {
	id: string;
	displayName: string;
	abbreviation?: string;
	logo?: string;
	color?: string;
	alternateColor?: string;
}

export interface Event {
	id: string;
	date: Date;
	name: string;
	completed: boolean;
	shortName: string;
	league: string;
	leagueAbbreviation: string;
	sportId: string;
	leagueId: string;
	network: string | null;
	venue: string;
	homeTeam: Team;
	awayTeam: Team;
	homeScore: string | number;
	awayScore: string | number;
}

export interface GraphDay {
	date: Date;
	events: Event[];
	hasCompletedEvent: boolean;
	hasFutureEvent: boolean;
}

export interface League {
	id: string;
	sportId: string;
	name: string;
	abbreviation: string;
}

export interface LeagueFilter {
	sportId: string;
	leagueId: string;
}

export interface FilterState {
	selectedLeagues: string[] | null;
	selectedTeams: string[] | null;
}
