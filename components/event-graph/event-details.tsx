"use client";

import React, { useMemo, useState } from "react";
import { GraphDay, League } from "@/types";
import { CompletedGame, LiveGame, FutureGame } from "./event-components";
import { useFilters } from "@/hooks/useFilters";
import { IoMdClose } from "react-icons/io";
import { FaSearch } from "react-icons/fa";

interface EventDetailsProps {
	day: GraphDay;
	onClose: () => void;
	allLeagues: League[];
}

export function EventDetails({ day, onClose, allLeagues }: EventDetailsProps) {
	const { filters } = useFilters();
	const [searchQuery, setSearchQuery] = useState("");

	// Filter events based on selected teams, leagues, and search query
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

		// Then filter by search query if present
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(event) =>
					// Search in team names
					event.homeTeam?.displayName?.toLowerCase().includes(query) ||
					event.awayTeam?.displayName?.toLowerCase().includes(query) ||
					// Search in league name
					event.league?.toLowerCase().includes(query) ||
					// Search in event name
					event.name?.toLowerCase().includes(query) ||
					// Search in league abbreviation
					event.leagueAbbreviation?.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [day.events, filters, searchQuery]);

	// Sort events by date
	const sortedEvents = useMemo(() => {
		return [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
	}, [filteredEvents]);

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

			{/* Search Section */}
			<div className='p-4 border-b border-gray-7 bg-gray-1'>
				<div className='relative'>
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search teams, leagues...'
						className='w-full bg-gray-3 border border-gray-6 rounded-md py-2 px-3 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500'
					/>
					<FaSearch
						className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-11'
						size={14}
					/>
				</div>
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
