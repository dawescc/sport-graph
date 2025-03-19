"use client";

import React, { useState, useEffect, useMemo } from "react";
import { processEventsForGraph } from "@/lib/process-event-for-graph";
import { fetchEventsData, getLeagues } from "@/app/graph/actions";
import { EventDetails } from "./event-details";
import { useFilters, mutateFilters } from "@/hooks/useFilters";
import { GraphDay, League } from "@/types";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaFilter, FaFootballBall, FaBasketballBall, FaBaseballBall, FaFutbol } from "react-icons/fa";

interface ContributionGraphProps {
	initialData: GraphDay[];
}

export function ContributionGraph({ initialData }: ContributionGraphProps) {
	const [graphData, setGraphData] = useState<GraphDay[]>(initialData || []);
	const [loading, setLoading] = useState(!initialData);
	const [monthOffset, setMonthOffset] = useState(0);
	const [selectedDay, setSelectedDay] = useState<GraphDay | null>(null);
	const [allLeagues, setAllLeagues] = useState<League[]>([]);
	const [isSportFilterOpen, setIsSportFilterOpen] = useState(false);
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

	// Get sport icon
	const getSportIcon = (sportId: string) => {
		switch (sportId) {
			case "soccer":
				return <FaFutbol className='mr-2' />;
			case "basketball":
				return <FaBasketballBall className='mr-2' />;
			case "football":
				return <FaFootballBall className='mr-2' />;
			case "baseball":
				return <FaBaseballBall className='mr-2' />;
			default:
				return <FaFutbol className='mr-2' />;
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

	return (
		<div className='w-full lg:grid lg:grid-cols-2 mx-auto bg-gray-1 rounded-lg overflow-hidden border border-gray-7'>
			<div className='border-r border-gray-7'>
				<div className='flex flex-col'>
					<div className='flex justify-between items-center p-4 border-b border-gray-7'>
						<h3 className='text-base font-medium text-white'>
							{monthName} {year}
						</h3>
						<div className='flex gap-1'>
							<button
								onClick={() => setMonthOffset(monthOffset - 1)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white transition-colors'
								aria-label='Previous month'>
								<FaChevronLeft size={16} />
							</button>
							<button
								onClick={() => setMonthOffset(0)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white transition-colors'
								aria-label='Today'>
								<FaCalendarAlt size={16} />
							</button>
							<button
								onClick={() => setMonthOffset(monthOffset + 1)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white transition-colors'
								aria-label='Next month'>
								<FaChevronRight size={16} />
							</button>
							<button
								onClick={() => setIsSportFilterOpen(!isSportFilterOpen)}
								className={`p-1.5 rounded-md ${
									isSportFilterOpen ? "bg-gray-6" : "bg-gray-3"
								} hover:bg-gray-4 text-white ml-2 transition-colors`}
								aria-label='Filter sports'>
								<FaFilter size={16} />
							</button>
						</div>
					</div>

					{/* Sport filter dropdown */}
					{isSportFilterOpen && (
						<div className='p-4 border-b border-gray-7 bg-gray-2'>
							<div className='flex justify-between items-center mb-3'>
								<h4 className='text-sm font-medium'>Filter Sports</h4>
								<button
									onClick={resetFilters}
									className='text-xs text-blue-500 hover:underline'>
									Show All
								</button>
							</div>
							<div className='grid grid-cols-2 gap-2'>
								{Object.entries(sportGroups).map(([sportId, leagues]) => {
									const sportLeagueIds = leagues.map((league) => `${league.sportId}-${league.id}`);
									const allSelected = sportLeagueIds.every((id) => !filters?.selectedLeagues || filters.selectedLeagues.includes(id));

									return (
										<button
											key={sportId}
											onClick={() => toggleSport(sportId)}
											className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
												allSelected ? "bg-gray-7 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
											}`}>
											{getSportIcon(sportId)}
											{getSportName(sportId)}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

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
										// Today is NOT highlighted if another day is selected
										let highlightClass = "";
										if (isSelected) {
											highlightClass = "ring-2 ring-orange-10";
										} else if (isToday && !selectedDay) {
											highlightClass = "ring-2 ring-orange-10";
										}

										return (
											<div
												key={`day-${weekIndex}-${dayIndex}`}
												className={`
                          aspect-square rounded-sm w-full h-auto flex items-center justify-center relative
                          ${bgColor} cursor-pointer transition-all
                          ${highlightClass}
                          hover:ring-2 hover:ring-white/30
                        `}
												onClick={() => setSelectedDay(day)}>
												{/* No numbers in the graph boxes as requested */}
											</div>
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
							Click on any colored square in the calendar to see games scheduled for that day. Use the filters above to focus on specific sports.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default ContributionGraph;
