"use client";

import React, { useMemo, useState, useEffect } from "react";
import { GraphDay, League } from "@/types";
import { CompletedGame, LiveGame, FutureGame } from "./event-components";
import { useFilters } from "@/hooks/useFilters";
import { IoMdClose } from "react-icons/io";
import { BsCircleFill } from "react-icons/bs";
import { FaSearch } from "react-icons/fa";

interface EventDetailsProps {
	day: GraphDay;
	onClose: () => void;
	allLeagues: League[];
}

export function EventDetails({ day, onClose, allLeagues }: EventDetailsProps) {
	const { filters, toggleLeague, toggleTeam, resetTeamFilters } = useFilters();
	const [leagueSearch, setLeagueSearch] = useState("");
	const [teamSearch, setTeamSearch] = useState("");

	// Reset team filters when day changes
	useEffect(() => {
		resetTeamFilters();
	}, [day.date, resetTeamFilters]);

	// Get unique teams from all events
	const uniqueTeams = useMemo(() => {
		// First, filter events by selected leagues (or all events if no leagues selected)
		const leagueFilteredEvents = filters?.selectedLeagues
			? day.events.filter((event) => filters.selectedLeagues?.includes(`${event.sportId}-${event.leagueId}`))
			: day.events;

		// Then get unique teams only from the league-filtered events
		return [
			...new Set(
				leagueFilteredEvents
					.flatMap((event) => [
						event.homeTeam?.displayName && `${event.homeTeam.displayName} (${event.leagueAbbreviation})`,
						event.awayTeam?.displayName && `${event.awayTeam.displayName} (${event.leagueAbbreviation})`,
					])
					.filter(Boolean)
			),
		];
	}, [day.events, filters?.selectedLeagues]);

	// Get unique leagues from all events
	const uniqueLeagues = useMemo(() => {
		return [...new Set(day.events.map((event) => `${event.sportId}-${event.leagueId}`))];
	}, [day.events]);

	// Get unique sports from all events
	const uniqueSports = useMemo(() => {
		return [...new Set(day.events.map((event) => event.sportId))];
	}, [day.events]);

	// Filter events based on selected teams and leagues
	const filteredEvents = useMemo(() => {
		// First filter by leagues
		let filtered = filters?.selectedLeagues
			? day.events.filter((event) => filters.selectedLeagues?.includes(`${event.sportId}-${event.leagueId}`))
			: day.events;

		// Then filter by teams
		if (filters?.selectedTeams) {
			filtered = filtered.filter(
				(event) =>
					filters.selectedTeams?.includes(`${event.homeTeam?.displayName} (${event.leagueAbbreviation})`) ||
					filters.selectedTeams?.includes(`${event.awayTeam?.displayName} (${event.leagueAbbreviation})`)
			);
		}

		return filtered;
	}, [day.events, filters]);

	// Sort events by date
	const sortedEvents = useMemo(() => {
		return [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
	}, [filteredEvents]);

	// Team color mapping (simplified version)
	const getTeamColor = (teamName: string) => {
		// Map team name to color - just a simple hash for demo
		const hash = teamName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const hue = hash % 360;
		return `hsl(${hue}, 70%, 50%)`;
	};

	// League color mapping
	const getLeagueColor = (leagueId: string) => {
		const hash = leagueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const hue = ((hash % 360) + 180) % 360; // Offset to differentiate from team colors
		return `hsl(${hue}, 70%, 50%)`;
	};

	// Group leagues by sport for better organization
	const leaguesBySport = useMemo(() => {
		const grouped: Record<string, { id: string; name: string }[]> = {};

		uniqueLeagues.forEach((leagueId) => {
			const [sportId, id] = leagueId.split("-");
			const league = allLeagues.find((l) => `${l.sportId}-${l.id}` === leagueId);

			if (!grouped[sportId]) {
				grouped[sportId] = [];
			}

			if (league) {
				grouped[sportId].push({ id: leagueId, name: league.name });
			} else {
				grouped[sportId].push({ id: leagueId, name: id });
			}
		});

		return grouped;
	}, [uniqueLeagues, allLeagues]);

	// Get sport name from ID
	const getSportName = (sportId: string): string => {
		switch (sportId) {
			case "soccer":
				return "Soccer";
			case "basketball":
				return "Basketball";
			case "football":
				return "Football";
			case "baseball":
				return "Baseball";
			default:
				return sportId.charAt(0).toUpperCase() + sportId.slice(1);
		}
	};

	// Filter leagues by search
	const filteredLeaguesBySport = useMemo(() => {
		if (!leagueSearch) return leaguesBySport;

		const result: Record<string, { id: string; name: string }[]> = {};

		Object.entries(leaguesBySport).forEach(([sportId, leagues]) => {
			const filteredLeagues = leagues.filter(
				(league) =>
					league.name.toLowerCase().includes(leagueSearch.toLowerCase()) || getSportName(sportId).toLowerCase().includes(leagueSearch.toLowerCase())
			);

			if (filteredLeagues.length > 0) {
				result[sportId] = filteredLeagues;
			}
		});

		return result;
	}, [leaguesBySport, leagueSearch]);

	// Filter teams by search
	const filteredTeams = useMemo(() => {
		if (!teamSearch) return uniqueTeams;

		return uniqueTeams.filter((team) => team.toLowerCase().includes(teamSearch.toLowerCase()));
	}, [uniqueTeams, teamSearch]);

	return (
		<div className='bg-gray-2 mt-4 lg:mt-0 rounded-lg overflow-hidden'>
			{/* Header */}
			<div className='flex justify-between items-center p-4 border-b border-gray-7 bg-gray-1'>
				<h3 className='text-lg font-medium'>
					{day.date.toLocaleDateString("en-US", {
						weekday: "long",
						month: "long",
						day: "numeric",
						year: "numeric",
						timeZone: "America/New_York",
					})}
				</h3>
				<button
					onClick={onClose}
					className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-7'
					aria-label='Close'>
					<IoMdClose size={18} />
				</button>
			</div>

			{/* Filters Section */}
			<div className='p-4 border-b border-gray-7 bg-gray-1'>
				{/* Sports and League filters */}
				{Object.keys(leaguesBySport).length > 0 && (
					<div className='mb-4'>
						<div className='flex justify-between items-center mb-2'>
							<div className='text-sm font-medium'>Filter by Sport & League</div>
							<div className='relative w-1/3'>
								<input
									type='text'
									value={leagueSearch}
									onChange={(e) => setLeagueSearch(e.target.value)}
									placeholder='Search leagues...'
									className='w-full bg-gray-3 border border-gray-6 rounded-md py-1 px-3 text-xs pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
								<FaSearch
									className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-11'
									size={12}
								/>
							</div>
						</div>
						<div className='space-y-3 max-h-40 overflow-y-auto pr-2'>
							{Object.entries(filteredLeaguesBySport).map(([sportId, leagues]) => (
								<div
									key={sportId}
									className='border-l-2 pl-3'
									style={{ borderColor: getLeagueColor(sportId) }}>
									<div className='text-xs font-semibold mb-1.5'>{getSportName(sportId)}</div>
									<div className='flex flex-wrap gap-1.5'>
										{leagues.map((league) => {
											const isSelected = !filters?.selectedLeagues || filters.selectedLeagues.includes(league.id);

											return (
												<button
													key={league.id}
													onClick={() => toggleLeague(league.id)}
													className={`px-2 py-0.5 text-xs rounded-md flex items-center gap-1 transition-colors ${
														isSelected ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
													}`}>
													{league.name}
													{isSelected && <IoMdClose size={10} />}
												</button>
											);
										})}
									</div>
								</div>
							))}
							{Object.keys(filteredLeaguesBySport).length === 0 && (
								<div className='text-center text-gray-11 text-xs py-2'>No leagues match your search</div>
							)}
						</div>
					</div>
				)}

				{/* Team filters */}
				{uniqueTeams.length > 0 && (
					<div>
						<div className='flex justify-between items-center mb-2'>
							<div className='text-sm font-medium'>Filter by Team</div>
							<div className='relative w-1/3'>
								<input
									type='text'
									value={teamSearch}
									onChange={(e) => setTeamSearch(e.target.value)}
									placeholder='Search teams...'
									className='w-full bg-gray-3 border border-gray-6 rounded-md py-1 px-3 text-xs pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
								<FaSearch
									className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-11'
									size={12}
								/>
							</div>
						</div>
						<div className='flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2'>
							{filteredTeams.map((team) => {
								const isSelected = !filters?.selectedTeams || filters.selectedTeams.includes(team);

								return (
									<button
										key={team}
										onClick={() => toggleTeam(team)}
										className={`px-2 py-0.5 text-xs rounded-md flex items-center gap-1 transition-colors ${
											isSelected ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
										}`}>
										<span
											className='w-2 h-2 rounded-full inline-block'
											style={{ backgroundColor: getTeamColor(team) }}
										/>
										{team}
										{isSelected && <IoMdClose size={10} />}
									</button>
								);
							})}
							{filteredTeams.length === 0 && <div className='text-center text-gray-11 text-xs py-2 w-full'>No teams match your search</div>}
						</div>
					</div>
				)}
			</div>

			{/* Events list */}
			<div className='p-4'>
				{sortedEvents.length === 0 ? (
					<div className='text-center text-gray-11 py-8'>No games found for the selected filters</div>
				) : (
					<div className='space-y-4'>
						{sortedEvents.map((event) => {
							const isLive =
								!event.completed && new Date() > new Date(event.date) && new Date() < new Date(event.date.getTime() + 3 * 60 * 60 * 1000); // Assuming games last ~3 hours

							if (event.completed) {
								return (
									<CompletedGame
										key={event.id}
										game={event}
									/>
								);
							} else if (isLive) {
								return (
									<LiveGame
										key={event.id}
										game={event}
									/>
								);
							} else {
								return (
									<FutureGame
										key={event.id}
										game={event}
									/>
								);
							}
						})}
					</div>
				)}
			</div>
		</div>
	);
}
