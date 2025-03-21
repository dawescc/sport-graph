"use client";

import React, { useMemo, useState } from "react";
import { GraphDay } from "@/types";
import { EventCard } from "./event-components";
import { useFilters } from "@/hooks/useFilters";
import { IoMdClose } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import { Dialog } from "radix-ui";

interface EventDetailsProps {
	day: GraphDay;
	onClose: () => void;
}

export function EventDetails({ day, onClose }: EventDetailsProps) {
	const { filters } = useFilters();
	const [searchQuery, setSearchQuery] = useState("");

	// Filter events based on filters and search query
	const filteredEvents = useMemo(() => {
		// Start with all events
		let filtered = day.events;

		// Apply league filters if any exist
		if (filters.leagues.length > 0) {
			filtered = filtered.filter((event) => filters.leagues.includes(`${event.sportId}-${event.leagueId}`));
		}

		// Apply team filters if any exist
		if (filters.teams.length > 0) {
			filtered = filtered.filter(
				(event) =>
					filters.teams.includes(`${event.homeTeam?.displayName} (${event.leagueAbbreviation})`) ||
					filters.teams.includes(`${event.awayTeam?.displayName} (${event.leagueAbbreviation})`)
			);
		}

		// Apply search query if present
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(event) =>
					event.homeTeam?.displayName?.toLowerCase().includes(query) ||
					event.awayTeam?.displayName?.toLowerCase().includes(query) ||
					event.league?.toLowerCase().includes(query) ||
					event.name?.toLowerCase().includes(query) ||
					event.leagueAbbreviation?.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [day.events, filters, searchQuery]);

	// Sort events by start time
	const sortedEvents = useMemo(() => {
		return [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
	}, [filteredEvents]);

	return (
		<Dialog.Root
			open={true}
			onOpenChange={() => onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className='fixed inset-0 h-dvh bg-black/40' />
				<Dialog.Content className='fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg w-full sm:-translate-x-1/2 sm:-translate-y-1/2 bg-gray-2 sm:rounded-lg flex flex-col h-full sm:max-h-[85dvh] sm:shadow-sm border-2'>
					{/* Header */}
					<div className='flex justify-between items-center p-4 border-b border-gray-7 bg-gray-1 sm:rounded-t-lg'>
						<Dialog.Title className='text-lg font-medium'>
							{day.date.toLocaleDateString(undefined, {
								weekday: "long",
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</Dialog.Title>
						<Dialog.Close
							className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-7'
							aria-label='Close'>
							<IoMdClose size={18} />
						</Dialog.Close>
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
					<div className='p-4 overflow-y-auto'>
						{sortedEvents.length === 0 ? (
							<div className='text-center text-gray-11 py-8'>No games found for the selected filters</div>
						) : (
							<div className='space-y-4'>
								{sortedEvents.map((event) => (
									<EventCard
										key={event.id}
										event={event}
									/>
								))}
							</div>
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
