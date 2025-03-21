"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchEventsData } from "@/app/graph/actions";
import { processEventsForGraph } from "@/lib/process-event-for-graph";
import { EventDetails } from "./event-details";
import { useFilters } from "@/hooks/useFilters";
import { GraphDay } from "@/types";
import { format } from "date-fns";
import { FaChevronLeft, FaChevronRight, FaFilter } from "react-icons/fa";

interface CalendarProps {
	initialData: GraphDay[];
}

export function SportsCalendar({ initialData }: CalendarProps) {
	// Basic state
	const [graphData, setGraphData] = useState<GraphDay[]>(initialData);
	const [monthOffset, setMonthOffset] = useState(0);
	const [loading, setLoading] = useState(false);
	const [selectedDay, setSelectedDay] = useState<GraphDay | null>(null);
	const [showFilters, setShowFilters] = useState(false);

	const { filters } = useFilters();

	// Get current month date for display
	const currentMonth = useMemo(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
	}, [monthOffset]);

	// Fetch data when month changes
	useEffect(() => {
		// Skip fetch if using initial data for current month
		if (monthOffset === 0 && initialData.length > 0 && !loading) {
			setGraphData(initialData);
			return;
		}

		async function loadMonth() {
			setLoading(true);
			try {
				const events = await fetchEventsData(monthOffset);
				setGraphData(processEventsForGraph(events, monthOffset));
			} catch (error) {
				console.error("Failed to load month data:", error);
			} finally {
				setLoading(false);
			}
		}

		loadMonth();
	}, [monthOffset, initialData]);

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

	return (
		<div className='w-full mx-auto'>
			{/* Header */}
			<div className='mb-4 flex justify-between items-center'>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => setMonthOffset((prev) => prev - 1)}
						className='p-2 rounded hover:bg-gray-3'
						disabled={loading}>
						<FaChevronLeft size={16} />
					</button>

					<h2 className='text-xl font-semibold'>{format(currentMonth, "MMMM yyyy")}</h2>

					<button
						onClick={() => setMonthOffset((prev) => prev + 1)}
						className='p-2 rounded hover:bg-gray-3'
						disabled={loading}>
						<FaChevronRight size={16} />
					</button>

					<button
						onClick={() => setMonthOffset(0)}
						className='ml-2 px-3 py-1 text-sm bg-gray-3 hover:bg-gray-4 rounded'
						disabled={loading || monthOffset === 0}>
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
					{loading ? (
						<div className='flex items-center justify-center h-64'>
							<div className='text-gray-11'>Loading...</div>
						</div>
					) : calendarGrid.length > 0 ? (
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

									return (
										<button
											key={`day-${day.date.getDate()}`}
											className={`
                        aspect-square relative rounded
                        ${bgColor}
                        ${isToday ? "ring-2 ring-orange-10" : ""}
                        ${isSelected ? "ring-2 ring-blue-10" : ""}
                        ${day.events.length > 0 ? "cursor-pointer hover:ring-2 hover:ring-blue-9/50" : "cursor-default"}
                      `}
											onClick={() => day.events.length > 0 && setSelectedDay(day)}
											disabled={day.events.length === 0}>
											<span className='absolute top-1 left-1 text-xs'>{day.date.getDate()}</span>
											{day.events.length > 0 && (
												<div className='absolute inset-0 flex items-center justify-center'>
													<span className='text-sm font-medium'>{day.events.length}</span>
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

			{/* Filter Dialog - simplified to just a prop we'd pass to a filter component */}
			{showFilters && (
				<div
					className='fixed inset-0 z-50'
					onClick={() => setShowFilters(false)}>
					{/* Filter component would go here */}
				</div>
			)}
		</div>
	);
}

export default SportsCalendar;
