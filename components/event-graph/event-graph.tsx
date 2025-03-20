"use client";

import React, { useState, useEffect, useMemo } from "react";
import { processEventsForGraph } from "@/lib/process-event-for-graph";
import { fetchEventsData, getLeagues } from "@/app/graph/actions";
import { EventDetails } from "./event-details";
import { useFilters, mutateFilters } from "@/hooks/useFilters";
import { GraphDay, League } from "@/types";
import {
	FaChevronDown,
	FaCalendarAlt,
	FaFilter,
	FaSlidersH,
	FaFootballBall,
	FaBasketballBall,
	FaBaseballBall,
	FaFutbol,
	FaTimes,
	FaChevronUp,
} from "react-icons/fa";
import { cn } from "@/lib/utils";

interface ContributionGraphProps {
	initialData: GraphDay[];
}

export function ContributionGraph({ initialData }: ContributionGraphProps) {
	const [graphData, setGraphData] = useState<GraphDay[]>(initialData || []);
	const [loading, setLoading] = useState(!initialData);
	const [monthOffset, setMonthOffset] = useState(0);
	const [selectedDay, setSelectedDay] = useState<GraphDay | null>(null);
	const [allLeagues, setAllLeagues] = useState<League[]>([]);
	const [allEvents, setAllEvents] = useState<Event[]>([]);
	const [isSportFilterOpen, setIsSportFilterOpen] = useState(false);
	const [isLeagueFilterOpen, setIsLeagueFilterOpen] = useState(false);
	const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
	const { filters, toggleLeague, resetFilters } = useFilters();

	// Load leagues on component mount
	useEffect(() => {
		async function loadLeagues() {
			try {
				const leagues = await getLeagues();
				setAllLeagues(leagues);
			} catch (error) {
				console.error("Error fetching leagues:", error);
			}
		}

		loadLeagues();
	}, []);

	// Set initial events from initialData
	useEffect(() => {
		if (initialData) {
			const events = initialData.reduce((acc, day) => [...acc, ...day.events], [] as Event[]);
			setAllEvents(events);
		}
	}, [initialData]);

	useEffect(() => {
		// If we already have data for the current month and monthOffset is 0, skip fetching
		if (monthOffset === 0 && initialData && !filters?.selectedLeagues) {
			setGraphData(initialData);
			setLoading(false);
			return;
		}

		async function loadData() {
			try {
				setLoading(true);
				const events = await fetchEventsData(monthOffset, filters?.selectedLeagues);
				setAllEvents(events);
				const processedData = processEventsForGraph(events, monthOffset);
				setGraphData(processedData);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		}

		loadData();
	}, [monthOffset, initialData, filters?.selectedLeagues]);

	// Get the month and year to display
	const currentMonth = useMemo(() => {
		const today = new Date();
		return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
	}, [monthOffset]);

	const monthName = currentMonth.toLocaleString("default", { month: "long" });
	const year = currentMonth.getFullYear();

	// Generate month options for dropdown
	const monthOptions = useMemo(() => {
		const options = [];
		const today = new Date();
		const currentYear = today.getFullYear();

		// Generate 12 months back and 12 months forward
		for (let i = -12; i <= 12; i++) {
			const date = new Date(currentYear, today.getMonth() + i, 1);
			options.push({
				value: i,
				label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
			});
		}

		return options;
	}, []);

	// Generate weekday headers with unique keys
	const weekdays = [
		{ key: "sun", label: "S" },
		{ key: "mon", label: "M" },
		{ key: "tue", label: "T" },
		{ key: "wed", label: "W" },
		{ key: "thu", label: "T" },
		{ key: "fri", label: "F" },
		{ key: "sat", label: "S" },
	];

	// Group leagues by sport
	const sportGroups = useMemo(() => {
		const groups: Record<string, League[]> = {};

		allLeagues.forEach((league) => {
			if (!groups[league.sportId]) {
				groups[league.sportId] = [];
			}
			groups[league.sportId].push(league);
		});

		return groups;
	}, [allLeagues]);

	// Get unique sports
	const uniqueSports = useMemo(() => {
		return Object.keys(sportGroups);
	}, [sportGroups]);

	// Get sport icon
	const getSportIcon = (sportId: string) => {
		switch (sportId) {
			case "soccer":
				return <FaFutbol className='size-[0.85em]' />;
			case "basketball":
				return <FaBasketballBall className='size-[0.85em]' />;
			case "football":
				return <FaFootballBall className='size-[0.85em]' />;
			case "baseball":
				return <FaBaseballBall className='size-[0.85em]' />;
			default:
				return <FaFutbol className='size-[0.85em]' />;
		}
	};

	// Get sport name
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

	// Toggle all leagues for a sport
	const toggleSport = (sportId: string) => {
		const sportLeagues = allLeagues.filter((league) => league.sportId === sportId);
		const sportLeagueIds = sportLeagues.map((league) => `${league.sportId}-${league.id}`);

		// Check if all leagues of this sport are currently selected
		const allSelected = sportLeagueIds.every((id) => !filters?.selectedLeagues || filters.selectedLeagues.includes(id));

		if (allSelected) {
			// If all are selected, deselect all leagues of this sport
			const newSelectedLeagues = filters?.selectedLeagues ? filters.selectedLeagues.filter((id) => !sportLeagueIds.includes(id)) : sportLeagueIds;

			// If we're removing all leagues and no other leagues are selected, reset to null (all leagues)
			if (newSelectedLeagues.length === 0) {
				resetFilters();
			} else {
				// Otherwise update with the new selection
				mutateFilters({
					...filters!,
					selectedLeagues: newSelectedLeagues.length > 0 ? newSelectedLeagues : null,
				});
			}
		} else {
			// If not all are selected, select all leagues of this sport
			const currentSelected = filters?.selectedLeagues || [];
			const newSelected = [...new Set([...currentSelected, ...sportLeagueIds])];

			mutateFilters({
				...filters!,
				selectedLeagues: newSelected,
			});
		}
	};

	// Count events being displayed vs total events
	const eventCounts = useMemo(() => {
		const totalEvents = allEvents.length;

		if (!filters?.selectedLeagues) {
			return { displayed: totalEvents, total: totalEvents };
		}

		const displayedEvents = allEvents.filter((event) => filters.selectedLeagues?.includes(`${event.sportId}-${event.leagueId}`));

		return { displayed: displayedEvents.length, total: totalEvents };
	}, [allEvents, filters?.selectedLeagues]);

	// Count selected leagues
	const selectedLeaguesCount = useMemo(() => {
		if (!filters?.selectedLeagues) return allLeagues.length;
		return filters.selectedLeagues.length;
	}, [filters?.selectedLeagues, allLeagues]);

	// Build calendar grid with proper week structure
	const calendarGrid = useMemo(() => {
		const grid = [];

		// First, determine the first day of the month
		let firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
		const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

		// Create proper week rows
		let currentWeek = Array(7).fill(null);
		let dayCounter = 1;

		// Fill in blanks before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			currentWeek[i] = { empty: true };
		}

		// Fill in actual days
		while (dayCounter <= daysInMonth) {
			for (let i = firstDay; i < 7 && dayCounter <= daysInMonth; i++) {
				const dayData = graphData.find((d) => d.date.getDate() === dayCounter) || {
					date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayCounter),
					events: [],
					hasCompletedEvent: false,
					hasFutureEvent: false,
				};

				currentWeek[i] = dayData;
				dayCounter++;
			}

			// Add the current week to the grid
			grid.push([...currentWeek]);

			// Reset for next week
			currentWeek = Array(7).fill(null);
			firstDay = 0; // Reset first day for subsequent weeks
		}

		return grid;
	}, [graphData, currentMonth]);

	// Close all dropdowns when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (isSportFilterOpen || isLeagueFilterOpen || isMonthSelectorOpen) {
				const target = event.target as HTMLElement;
				if (!target.closest(".filter-dropdown")) {
					setIsSportFilterOpen(false);
					setIsLeagueFilterOpen(false);
					setIsMonthSelectorOpen(false);
				}
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isSportFilterOpen, isLeagueFilterOpen, isMonthSelectorOpen]);

	return (
		<div className='w-full mx-auto'>
			{/* Unified Filter Bar */}
			<div className='w-full bg-gray-1 rounded-lg p-4 mb-4 border border-gray-7'>
				<div className='flex flex-wrap gap-2 items-center'>
					{/* Month Selector */}
					<div className='relative filter-dropdown'>
						<button
							onClick={() => {
								setIsMonthSelectorOpen(!isMonthSelectorOpen);
								setIsSportFilterOpen(false);
								setIsLeagueFilterOpen(false);
							}}
							className={cn(
								`inline-flex items-center gap-2`,
								`rounded-lg px-3 py-2 text-sm`,
								`bg-gray-3 focus:outline-none`,
								"border border-gray-5",
								"shadow-xs",
								isSportFilterOpen ? "bg-gray-4 border-gray-6" : null
							)}>
							<FaCalendarAlt className='size-[0.85em]' />
							<span>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
							{isMonthSelectorOpen ? <FaChevronUp className='size-[0.85em]' /> : <FaChevronDown className='size-[0.85em]' />}
						</button>

						{isMonthSelectorOpen && (
							<div className='absolute z-10 mt-1 w-56 rounded-md bg-gray-2 shadow-lg border border-gray-7'>
								<div className='py-1 max-h-60 overflow-y-auto'>
									{monthOptions.map((option) => (
										<button
											key={option.value}
											onClick={() => {
												setMonthOffset(option.value);
												setIsMonthSelectorOpen(false);
											}}
											className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-4 ${
												option.value === monthOffset ? "bg-gray-5 font-medium" : ""
											}`}>
											{option.label}
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Sports Filter (Controls) */}
					<div className='relative filter-dropdown'>
						<button
							onClick={() => {
								setIsSportFilterOpen(!isSportFilterOpen);
								setIsLeagueFilterOpen(false);
								setIsMonthSelectorOpen(false);
							}}
							className={cn(
								`inline-flex items-center gap-2`,
								`rounded-lg px-3 py-2 text-sm`,
								`bg-gray-3 focus:outline-none`,
								"border border-gray-5",
								"shadow-xs",
								isSportFilterOpen ? "bg-gray-4 border-gray-6" : null
							)}>
							<FaSlidersH className='size-[0.85em]' />

							<span className=''>Sports</span>

							{uniqueSports.length > 0 && <span className='rounded-full p-2 py-0.5 bg-blue-10 text-whitea-12'>{uniqueSports.length}</span>}

							{isSportFilterOpen ? <FaChevronUp className='size-[0.85em]' /> : <FaChevronDown className='size-[0.85em]' />}
						</button>

						{isSportFilterOpen && (
							<div className='absolute z-10 mt-1 w-64 rounded-md bg-gray-2 shadow-lg border border-gray-7'>
								<div className='p-3'>
									<div className='flex justify-between items-center mb-2'>
										<h3 className='text-sm font-medium'>Select Sports</h3>
										<button
											onClick={resetFilters}
											className='text-xs text-blue-500 hover:underline'>
											Reset
										</button>
									</div>
									<div className='space-y-2 max-h-60 overflow-y-auto'>
										{Object.entries(sportGroups).map(([sportId, leagues]) => {
											const sportLeagueIds = leagues.map((league) => `${league.sportId}-${league.id}`);
											const allSelected = sportLeagueIds.every((id) => !filters?.selectedLeagues || filters.selectedLeagues.includes(id));

											return (
												<div
													key={sportId}
													className='flex items-center space-x-2'>
													<input
														id={`sport-${sportId}`}
														type='checkbox'
														checked={allSelected}
														onChange={() => toggleSport(sportId)}
														className='h-4 w-4 rounded border-gray-7 text-blue-9 focus:ring-blue-5'
													/>
													<label
														htmlFor={`sport-${sportId}`}
														className='text-sm cursor-pointer flex items-center'>
														{getSportIcon(sportId)}
														{getSportName(sportId)}
													</label>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Leagues Filter (Filters) */}
					<div className='relative filter-dropdown'>
						<button
							onClick={() => {
								setIsLeagueFilterOpen(!isLeagueFilterOpen);
								setIsSportFilterOpen(false);
								setIsMonthSelectorOpen(false);
							}}
							className={cn(
								`inline-flex items-center gap-2`,
								`rounded-lg px-3 py-2 text-sm`,
								`bg-gray-3 focus:outline-none`,
								"border border-gray-5",
								"shadow-xs",
								isLeagueFilterOpen ? "bg-gray-4 border-gray-6" : null
							)}>
							<FaFilter className='size-[0.85em]' />
							<span className=''>Leagues</span>

							{selectedLeaguesCount > 0 && <span className='rounded-full p-2 py-0.5 bg-blue-10 text-whitea-12'>{selectedLeaguesCount}</span>}

							{isLeagueFilterOpen ? <FaChevronUp className='size-[0.85em]' /> : <FaChevronDown className='size-[0.85em]' />}
						</button>

						{isLeagueFilterOpen && (
							<div className='absolute z-10 mt-1 w-72 rounded-md bg-gray-2 shadow-lg border border-gray-7'>
								<div className='p-3'>
									<div className='flex justify-between items-center mb-2'>
										<h3 className='text-sm font-medium'>Select Leagues</h3>
										<button
											onClick={resetFilters}
											className='text-xs text-blue-500 hover:underline'>
											Reset
										</button>
									</div>
									<div className='space-y-3 max-h-72 overflow-y-auto'>
										{Object.entries(sportGroups).map(([sportId, leagues]) => (
											<div
												key={sportId}
												className='border-l-2 pl-3'
												style={{ borderColor: `hsl(${parseInt(sportId, 36) % 360}, 70%, 50%)` }}>
												<div className='text-xs font-semibold mb-1.5'>{getSportName(sportId)}</div>
												<div className='flex flex-wrap gap-1.5'>
													{leagues.map((league) => {
														const leagueId = `${league.sportId}-${league.id}`;
														const isSelected = !filters?.selectedLeagues || filters.selectedLeagues.includes(leagueId);

														return (
															<button
																key={leagueId}
																onClick={() => toggleLeague(leagueId)}
																className={`px-2 py-0.5 text-xs rounded-md flex items-center gap-1 transition-colors ${
																	isSelected ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
																}`}>
																{league.name}
																{isSelected && <FaTimes className='h-3 w-3' />}
															</button>
														);
													})}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Event count display */}
				<div className='mt-3 text-sm text-gray-11'>
					{eventCounts.displayed} / {eventCounts.total} Events • from {selectedLeaguesCount} selected leagues
				</div>
			</div>

			{/* Graph and Details */}
			<div className='lg:grid lg:grid-cols-2 bg-gray-1 rounded-lg overflow-hidden border border-gray-7'>
				<div className='border-r border-gray-7'>
					{loading ? (
						<div className='flex items-center justify-center h-48'>
							<div className='text-gray-11'>Loading events...</div>
						</div>
					) : (
						<div className='p-4'>
							<div className='grid grid-cols-7 gap-0.5 mb-2'>
								{weekdays.map((day) => (
									<div
										key={day.key}
										className='text-xs text-gray-11 text-center font-medium'>
										{day.label}
									</div>
								))}
							</div>

							<div className='grid grid-cols-7 place-items-center gap-1.5 gap-y-1 aspect-square'>
								{calendarGrid.map((week, weekIndex) => (
									<React.Fragment key={`week-${weekIndex}`}>
										{week.map((day: any, dayIndex) => {
											if (!day)
												return (
													<div
														key={`empty-${weekIndex}-${dayIndex}`}
														className='aspect-square'></div>
												);
											if (day.empty)
												return (
													<div
														key={`before-${weekIndex}-${dayIndex}`}
														className='aspect-square rounded-sm w-full h-auto bg-gray-3 opacity-30'></div>
												);

											// Determine color based on events and completed status
											let bgColor = "bg-gray-3"; // Default - no events

											if (day.hasCompletedEvent && day.hasFutureEvent) {
												// Mix of completed and future events - use a medium green
												bgColor = "bg-green-10";
											} else if (day.hasCompletedEvent) {
												// All completed events - use a gradient based on count
												const count = day.events.length;
												if (count > 10) bgColor = "bg-green-12";
												else if (count > 5) bgColor = "bg-green-10";
												else bgColor = "bg-green-8";
											} else if (day.hasFutureEvent) {
												// Future events - use blue with gradient based on count
												const count = day.events.length;
												if (count > 10) bgColor = "bg-blue-12";
												else if (count > 5) bgColor = "bg-blue-10";
												else bgColor = "bg-blue-8";
											}

											const isToday = day.date.toDateString() === new Date().toDateString();
											const isSelected = selectedDay && day.date.toDateString() === selectedDay.date.toDateString();

											// Apply highlighting for selected day only
											let highlightClass = "";
											if (isSelected) {
												highlightClass = "ring-2 ring-orange-10";
											} else if (isToday && !selectedDay) {
												highlightClass = "ring-2 ring-orange-10";
											}

											return (
												<div
													key={`day-${weekIndex}-${dayIndex}`}
													className={cn(
														`aspect-square rounded-sm w-full h-auto flex items-center justify-center relative cursor-pointer transition-all hover:ring-2 ring-orange-10/50`,
														bgColor,
														highlightClass
													)}
													onClick={() => setSelectedDay(day)}></div>
											);
										})}
									</React.Fragment>
								))}
							</div>

							<div className='flex items-center justify-end mt-4 text-xs text-gray-11'>
								<div className='flex items-center gap-1 mr-2'>
									<div className='w-3 h-3 bg-gray-3 rounded-sm'></div>
									<span>0</span>
								</div>
								<div className='flex items-center gap-1 mr-2'>
									<div className='w-3 h-3 bg-green-8 rounded-sm'></div>
									<span>1-5</span>
								</div>
								<div className='flex items-center gap-1 mr-2'>
									<div className='w-3 h-3 bg-green-10 rounded-sm'></div>
									<span>6-10</span>
								</div>
								<div className='flex items-center gap-1'>
									<div className='w-3 h-3 bg-green-12 rounded-sm'></div>
									<span>10+</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Event Details */}
				{selectedDay ? (
					<EventDetails
						day={selectedDay}
						onClose={() => setSelectedDay(null)}
						allLeagues={allLeagues}
					/>
				) : (
					<div className='flex items-center justify-center h-full bg-gray-2 p-8 text-center'>
						<div className='max-w-md'>
							<h3 className='text-lg font-medium mb-2'>Select a day to view events</h3>
							<p className='text-gray-11 text-sm'>
								Click on any colored square in the calendar to see games scheduled for that day. Use the filters above to focus on specific
								sports.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ContributionGraph;
