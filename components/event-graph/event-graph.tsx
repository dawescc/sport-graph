"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchEventsData, getLeagues } from "@/app/graph/actions";
import { processEventsForGraph } from "@/lib/process-event-for-graph";
import { EventDetails } from "./event-details";
import { useFilters } from "@/hooks/useFilters";
import { GraphDay, Event, League } from "@/types";
import { format } from "date-fns";
import { FaChevronLeft, FaChevronRight, FaFilter, FaTimes } from "react-icons/fa";
import { Dialog } from "radix-ui";

interface CalendarProps {
	initialData: GraphDay[];
}

export function SportsCalendar({ initialData }: CalendarProps) {
	// Basic state
	const [graphData, setGraphData] = useState<GraphDay[]>(initialData);
	const [monthOffset, setMonthOffset] = useState(0);
	const [loadingMonths, setLoadingMonths] = useState<Record<number, boolean>>({});
	const [monthData, setMonthData] = useState<Record<number, GraphDay[]>>({
		0: initialData,
	});
	const [selectedDay, setSelectedDay] = useState<GraphDay | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [leagues, setLeagues] = useState<League[]>([]);

	// Track active fetch requests
	const activeRequestsRef = useRef<Record<number, boolean>>({});

	const { filters, toggleLeague, resetFilters } = useFilters();

	// Get current month date for display
	const currentMonth = useMemo(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
	}, [monthOffset]);

	// Fetch leagues on component mount
	useEffect(() => {
		async function fetchLeagues() {
			try {
				const leagueData = await getLeagues();
				setLeagues(leagueData);
			} catch (error) {
				console.error("Failed to fetch leagues:", error);
			}
		}

		fetchLeagues();
	}, []);

	// Function to load a specific month's data
	const loadMonthData = async (offset: number) => {
		// Skip if we already have this month's data
		if (monthData[offset] && !loadingMonths[offset]) {
			return;
		}

		// Mark this month as loading
		setLoadingMonths((prev) => ({ ...prev, [offset]: true }));

		// Track this request as active
		activeRequestsRef.current[offset] = true;

		try {
			const events = await fetchEventsData(offset);

			// Check if this request is still active (not superseded by another navigation)
			if (activeRequestsRef.current[offset]) {
				const processedData = processEventsForGraph(events, offset);
				setMonthData((prev) => ({ ...prev, [offset]: processedData }));

				// If this is the current month, update the graph data
				if (offset === monthOffset) {
					setGraphData(processedData);
				}
			}
		} catch (error) {
			console.error("Failed to load month data:", error);
		} finally {
			// Only update if this request is still relevant
			if (activeRequestsRef.current[offset]) {
				setLoadingMonths((prev) => ({ ...prev, [offset]: false }));
				delete activeRequestsRef.current[offset];
			}
		}
	};

	// Effect to handle month changes and prefetching
	useEffect(() => {
		// Set the current month's data as the active graph data if available
		if (monthData[monthOffset]) {
			setGraphData(monthData[monthOffset]);
		} else {
			// Create empty calendar data as a placeholder
			const emptyData = generateEmptyMonthData(monthOffset);
			setGraphData(emptyData);
		}

		// Load current month if needed
		loadMonthData(monthOffset);

		// Prefetch adjacent months
		const prefetchOffsets = [monthOffset - 1, monthOffset + 1];
		prefetchOffsets.forEach((offset) => {
			// Use a slight delay to prioritize the current month
			setTimeout(() => {
				if (!monthData[offset]) {
					loadMonthData(offset);
				}
			}, 500);
		});

		// Cleanup function to mark all requests as inactive when component unmounts
		return () => {
			activeRequestsRef.current = {};
		};
	}, [monthOffset]);

	// Generate empty month data for skeleton loading
	const generateEmptyMonthData = (offset: number): GraphDay[] => {
		const now = new Date();
		const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
		const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

		return Array.from({ length: daysInMonth }, (_, i) => ({
			date: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i + 1),
			events: [],
			hasCompletedEvent: false,
			hasFutureEvent: false,
		}));
	};

	// Filter the graph data client-side
	const filteredData = useMemo(() => {
		if (!filters.leagues.length) {
			return graphData;
		}

		return graphData.map((day) => {
			const filteredEvents = day.events.filter((event) => filters.leagues.includes(`${event.sportId}-${event.leagueId}`));

			return {
				...day,
				events: filteredEvents,
				hasCompletedEvent: filteredEvents.some((e) => e.completed),
				hasFutureEvent: filteredEvents.some((e) => !e.completed),
			};
		});
	}, [graphData, filters.leagues]);

	// Generate calendar grid
	const calendarGrid = useMemo(() => {
		if (!filteredData.length) return [];

		const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

		const weeks = [];
		let currentWeek = Array(firstDayOfMonth).fill(null);

		filteredData.forEach((day) => {
			currentWeek.push(day);

			if (currentWeek.length === 7) {
				weeks.push([...currentWeek]);
				currentWeek = [];
			}
		});

		if (currentWeek.length > 0) {
			weeks.push([...currentWeek, ...Array(7 - currentWeek.length).fill(null)]);
		}

		return weeks;
	}, [filteredData, currentMonth]);

	// Handle month navigation
	const navigateMonth = (newOffset: number) => {
		// Update the month offset to navigate
		setMonthOffset(newOffset);
	};

	// Group leagues by sport for the filter dialog
	const sportGroups = useMemo(() => {
		const groups: Record<string, League[]> = {};

		leagues.forEach((league) => {
			if (!groups[league.sportId]) {
				groups[league.sportId] = [];
			}
			groups[league.sportId].push(league);
		});

		return groups;
	}, [leagues]);

	// Check if current month is loading
	const isCurrentMonthLoading = loadingMonths[monthOffset] === true;

	return (
		<div className='w-full mx-auto'>
			{/* Header */}
			<div className='mb-4 flex justify-between items-center'>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => navigateMonth(monthOffset - 1)}
						className='p-2 rounded hover:bg-gray-3'>
						<FaChevronLeft size={16} />
					</button>

					<h2 className='text-xl font-semibold'>
						{format(currentMonth, "MMMM yyyy")}
						{isCurrentMonthLoading && <span className='ml-2 text-sm text-gray-11 animate-pulse'>Loading...</span>}
					</h2>

					<button
						onClick={() => navigateMonth(monthOffset + 1)}
						className='p-2 rounded hover:bg-gray-3'>
						<FaChevronRight size={16} />
					</button>

					<button
						onClick={() => navigateMonth(0)}
						className='ml-2 px-3 py-1 text-sm bg-gray-3 hover:bg-gray-4 rounded'
						disabled={monthOffset === 0}>
						Today
					</button>
				</div>

				<button
					onClick={() => setShowFilters(true)}
					className='px-3 py-2 bg-gray-3 hover:bg-gray-4 rounded flex items-center gap-2'>
					<FaFilter size={14} />
					<span>Filters</span>
					{filters.leagues.length > 0 && <span className='bg-blue-10 text-white px-2 py-0.5 rounded-full text-xs'>{filters.leagues.length}</span>}
				</button>
			</div>

			{/* Calendar */}
			<div className='bg-gray-2 rounded-lg border border-gray-6 overflow-hidden'>
				{/* Weekday Headers */}
				<div className='grid grid-cols-7 text-center border-b border-gray-6 bg-gray-3'>
					{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
						<div
							key={day}
							className='py-2 text-sm font-medium'>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Grid */}
				<div className='p-2 min-h-[300px]'>
					{calendarGrid.length > 0 ? (
						calendarGrid.map((week, weekIndex) => (
							<div
								key={weekIndex}
								className='grid grid-cols-7 gap-1 mb-1'>
								{week.map((day, dayIndex) => {
									if (!day) {
										return (
											<div
												key={`empty-${weekIndex}-${dayIndex}`}
												className='aspect-square bg-gray-3/30 rounded'
											/>
										);
									}

									// Color based on events
									let bgColor = "bg-gray-3";

									if (day.hasCompletedEvent && day.hasFutureEvent) {
										bgColor = "bg-green-10";
									} else if (day.hasCompletedEvent) {
										const count = day.events.length;
										bgColor = count > 10 ? "bg-green-12" : count > 5 ? "bg-green-10" : "bg-green-8";
									} else if (day.hasFutureEvent) {
										const count = day.events.length;
										bgColor = count > 10 ? "bg-blue-12" : count > 5 ? "bg-blue-10" : "bg-blue-8";
									}

									const isToday = day.date.toDateString() === new Date().toDateString();
									const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();
									const isLoading = isCurrentMonthLoading;

									return (
										<button
											key={`day-${day.date.getDate()}`}
											className={`
                        aspect-square relative rounded
                        ${bgColor}
                        ${isToday ? "ring-2 ring-orange-10" : ""}
                        ${isSelected ? "ring-2 ring-blue-10" : ""}
                        ${day.events.length > 0 ? "cursor-pointer hover:ring-2 hover:ring-blue-9/50" : "cursor-default"}
                        ${isLoading ? "opacity-70" : ""}
                      `}
											onClick={() => day.events.length > 0 && setSelectedDay(day)}
											disabled={day.events.length === 0}>
											<span className='absolute top-1 left-1 text-xs'>{day.date.getDate()}</span>
											{day.events.length > 0 && (
												<div className='absolute inset-0 flex items-center justify-center'>
													<span className='text-sm font-medium'>{isLoading ? "..." : day.events.length}</span>
												</div>
											)}
											{isLoading && day.events.length > 0 && (
												<div className='absolute inset-0 flex items-center justify-center bg-gray-900/10 rounded'>
													<div className='w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin'></div>
												</div>
											)}
										</button>
									);
								})}
							</div>
						))
					) : (
						<div className='flex items-center justify-center h-64'>
							<div className='text-gray-11'>No events found</div>
						</div>
					)}
				</div>
			</div>

			{/* Event Details */}
			{selectedDay && (
				<EventDetails
					day={selectedDay}
					onClose={() => setSelectedDay(null)}
				/>
			)}

			{/* Filter Dialog */}
			{showFilters && (
				<Dialog.Root
					open={showFilters}
					onOpenChange={setShowFilters}>
					<Dialog.Portal>
						<Dialog.Overlay className='fixed inset-0 h-dvh bg-black/40' />
						<Dialog.Content className='fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg w-full sm:-translate-x-1/2 sm:-translate-y-1/2 bg-gray-2 sm:rounded-lg flex flex-col h-full sm:max-h-[85dvh] sm:shadow-sm border-2'>
							{/* Header */}
							<div className='flex justify-between items-center p-4 border-b border-gray-7 bg-gray-1 sm:rounded-t-lg'>
								<Dialog.Title className='text-lg font-medium'>Filters</Dialog.Title>
								<div className='flex items-center gap-2'>
									{filters.leagues.length > 0 && (
										<button
											onClick={resetFilters}
											className='text-sm text-blue-10 hover:underline'>
											Reset
										</button>
									)}
									<Dialog.Close
										className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-7'
										aria-label='Close'>
										<FaTimes size={18} />
									</Dialog.Close>
								</div>
							</div>

							{/* Content */}
							<div className='p-4 overflow-y-auto'>
								{Object.entries(sportGroups).map(([sportId, sportLeagues]) => (
									<div
										key={sportId}
										className='mb-6'>
										<h3 className='text-sm font-semibold mb-3'>{sportId.charAt(0).toUpperCase() + sportId.slice(1)}</h3>

										<div className='flex flex-wrap gap-2'>
											{sportLeagues.map((league) => {
												const leagueId = `${league.sportId}-${league.id}`;
												const isSelected = filters.leagues.includes(leagueId);

												return (
													<button
														key={leagueId}
														onClick={() => toggleLeague(leagueId)}
														className={`
                        px-3 py-1.5 text-sm rounded-full flex items-center gap-2
                        ${isSelected ? "bg-blue-10 text-white" : "bg-gray-4 hover:bg-gray-5"}
                      `}>
														{league.name}
														{isSelected && <FaTimes size={12} />}
													</button>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			)}
		</div>
	);
}

export default SportsCalendar;
