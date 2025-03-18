"use client";

import React, { useState, useEffect, useMemo } from "react";
import { processEventsForGraph } from "./process-event-for-graph";
import { fetchEventsData, getLeagues } from "@/app/graph/actions";

// Game status components
const CompletedGame = ({ game }) => (
	<div className='bg-gray-2 rounded-lg p-3 mb-2'>
		<div className='flex items-center justify-between mb-2'>
			<div className='flex items-center space-x-2'>
				{game.homeTeam?.logo && (
					<picture>
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.homeTeam?.displayName}</span>
				{game.homeScore > game.awayScore && <span className='text-green-9 text-xs font-bold ml-1'>W</span>}
			</div>
			<span className='font-bold'>{game.homeScore}</span>
		</div>

		<div className='flex items-center justify-between'>
			<div className='flex items-center space-x-2'>
				{game.awayTeam?.logo && (
					<picture>
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.awayTeam?.displayName}</span>
				{game.homeScore < game.awayScore && <span className='text-green-9 text-xs font-bold ml-1'>W</span>}
			</div>
			<span className='font-bold'>{game.awayScore}</span>
		</div>

		<div className='mt-2 text-xs text-gray-11 flex items-center justify-between'>
			<span>{game.leagueAbbreviation})</span>
			<span>{new Date(game.date).toLocaleDateString("en-US", { timeZone: "America/New_York" })}</span>
		</div>
	</div>
);

const LiveGame = ({ game }) => (
	<div className='bg-gray-2 rounded-lg p-3 mb-2 border-l-2 border-red-9'>
		<div className='flex items-center justify-between mb-2'>
			<div className='flex items-center space-x-2'>
				{game.homeTeam?.logo && (
					<picture>
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.homeTeam?.displayName}</span>
			</div>
			<span className='font-bold'>{game.homeScore}</span>
		</div>

		<div className='flex items-center justify-between'>
			<div className='flex items-center space-x-2'>
				{game.awayTeam?.logo && (
					<picture>
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.awayTeam?.displayName}</span>
			</div>
			<span className='font-bold'>{game.awayScore}</span>
		</div>

		<div className='mt-2 text-xs flex items-center justify-between'>
			<span className='text-red-9 font-medium'>LIVE</span>
			<span className='text-gray-11'>
				{game.league} ({game.leagueAbbreviation}){game.network && ` • ${game.network}`}
			</span>
		</div>
	</div>
);

const FutureGame = ({ game }) => (
	<div className='bg-gray-2 rounded-lg p-3 mb-2'>
		<div className='flex items-center justify-between mb-2'>
			<div className='flex items-center space-x-2'>
				{game.homeTeam?.logo && (
					<picture>
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.homeTeam?.displayName}</span>
			</div>
		</div>

		<div className='flex items-center justify-between'>
			<div className='flex items-center space-x-2'>
				{game.awayTeam?.logo && (
					<picture>
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
						/>
					</picture>
				)}
				<span className='font-medium'>{game.awayTeam?.displayName}</span>
			</div>
		</div>

		<div className='mt-2 text-xs text-gray-11 flex items-center justify-between'>
			<span>
				{game.leagueAbbreviation} {game.network && ` • ${game.network}`}
			</span>
			<span>
				{new Date(game.date).toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					timeZone: "America/New_York",
				})}
			</span>
		</div>
	</div>
);

// Event details section with team and league filters
function EventDetails({ day, onClose, allLeagues }) {
	const [selectedTeams, setSelectedTeams] = useState(new Set());
	const [selectedLeagues, setSelectedLeagues] = useState(new Set());

	// Get unique teams from all events
	const uniqueTeams = useMemo(() => {
		// First, filter events by selected leagues (or all events if no leagues selected)
		const leagueFilteredEvents =
			selectedLeagues.size > 0 ? day.events.filter((event) => selectedLeagues.has(`${event.sportId}-${event.leagueId}`)) : day.events;

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
	}, [day.events, selectedLeagues]);

	// Get unique leagues from all events
	const uniqueLeagues = useMemo(() => {
		return [...new Set(day.events.map((event) => `${event.sportId}-${event.leagueId}`))];
	}, [day.events]);

	// Toggle team selection for filtering
	const toggleTeam = (team) => {
		const newSelectedTeams = new Set(selectedTeams);

		// If no teams are selected or multiple teams are selected,
		// clicking one team should show only that team
		if (selectedTeams.size === 0 || (selectedTeams.size > 1 && selectedTeams.has(team))) {
			newSelectedTeams.clear();
			newSelectedTeams.add(team);
		}
		// If only this team is selected, clicking it again shows all teams
		else if (selectedTeams.size === 1 && selectedTeams.has(team)) {
			newSelectedTeams.clear();
		}
		// If another single team is selected, add this one too
		else {
			newSelectedTeams.add(team);
		}

		setSelectedTeams(newSelectedTeams);
	};

	// Toggle league selection for filtering
	const toggleLeague = (leagueId) => {
		const newSelectedLeagues = new Set(selectedLeagues);

		// If no leagues are selected or multiple leagues are selected,
		// clicking one league should show only that league
		if (selectedLeagues.size === 0 || (selectedLeagues.size > 1 && selectedLeagues.has(leagueId))) {
			newSelectedLeagues.clear();
			newSelectedLeagues.add(leagueId);
		}
		// If only this league is selected, clicking it again shows all leagues
		else if (selectedLeagues.size === 1 && selectedLeagues.has(leagueId)) {
			newSelectedLeagues.clear();
		}
		// If another single league is selected, add this one too
		else {
			newSelectedLeagues.add(leagueId);
		}

		setSelectedLeagues(newSelectedLeagues);
	};

	// Filter events based on selected teams and leagues
	const filteredEvents = useMemo(() => {
		// First filter by leagues
		let filtered = selectedLeagues.size > 0 ? day.events.filter((event) => selectedLeagues.has(`${event.sportId}-${event.leagueId}`)) : day.events;

		// Then filter by teams
		if (selectedTeams.size > 0) {
			filtered = filtered.filter(
				(event) =>
					selectedTeams.has(`${event.homeTeam?.displayName} (${event.leagueAbbreviation})`) ||
					selectedTeams.has(`${event.awayTeam?.displayName} (${event.leagueAbbreviation})`)
			);
		}

		return filtered;
	}, [day.events, selectedTeams, selectedLeagues]);

	// Sort events by date
	const sortedEvents = useMemo(() => {
		return [...filteredEvents].sort((a, b) => a.date - b.date);
	}, [filteredEvents]);

	// Team color mapping (simplified version)
	const getTeamColor = (teamName) => {
		// Map team name to color - just a simple hash for demo
		const hash = teamName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const hue = hash % 360;
		return `hsl(${hue}, 70%, 50%)`;
	};

	// League color mapping
	const getLeagueColor = (leagueId) => {
		const hash = leagueId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const hue = ((hash % 360) + 180) % 360; // Offset to differentiate from team colors
		return `hsl(${hue}, 70%, 50%)`;
	};

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
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='18'
						height='18'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'>
						<line
							x1='18'
							y1='6'
							x2='6'
							y2='18'></line>
						<line
							x1='6'
							y1='6'
							x2='18'
							y2='18'></line>
					</svg>
				</button>
			</div>

			{/* League filters */}
			{uniqueLeagues.length > 0 && (
				<div className='p-4 border-b border-gray-7 bg-gray-1'>
					<div className='text-sm text-gray-11 mb-2'>Filter by league:</div>
					<div className='flex flex-wrap gap-2'>
						{uniqueLeagues.map((leagueId) => {
							const league = allLeagues.find((l) => `${l.sportId}-${l.id}` === leagueId);
							return (
								<button
									key={leagueId}
									onClick={() => toggleLeague(leagueId)}
									className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
										selectedLeagues.has(leagueId) ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
									}`}>
									<span
										className='w-3 h-3 rounded-full'
										style={{ backgroundColor: getLeagueColor(leagueId) }}
									/>
									{league ? `${league.name}` : leagueId}
									{selectedLeagues.has(leagueId) && (
										<svg
											xmlns='http://www.w3.org/2000/svg'
											width='12'
											height='12'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'>
											<line
												x1='18'
												y1='6'
												x2='6'
												y2='18'></line>
											<line
												x1='6'
												y1='6'
												x2='18'
												y2='18'></line>
										</svg>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Team filters */}
			{uniqueTeams.length > 0 && (
				<div className='p-4 border-b border-gray-7 bg-gray-1'>
					<div className='text-sm text-gray-11 mb-2'>Filter by team:</div>
					<div className='flex flex-wrap gap-2'>
						{uniqueTeams.map((team) => (
							<button
								key={team}
								onClick={() => toggleTeam(team)}
								className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
									selectedTeams.has(team) ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
								}`}>
								<span
									className='w-3 h-3 rounded-full'
									style={{ backgroundColor: getTeamColor(team) }}
								/>
								{team}
								{selectedTeams.has(team) && (
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='12'
										height='12'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'>
										<line
											x1='18'
											y1='6'
											x2='6'
											y2='18'></line>
										<line
											x1='6'
											y1='6'
											x2='18'
											y2='18'></line>
									</svg>
								)}
							</button>
						))}
					</div>
				</div>
			)}

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

export function ContributionGraph({ initialData }) {
	const [graphData, setGraphData] = useState(initialData || []);
	const [loading, setLoading] = useState(!initialData);
	const [monthOffset, setMonthOffset] = useState(0);
	const [selectedDay, setSelectedDay] = useState(null);
	const [allLeagues, setAllLeagues] = useState([]);
	const [activeLeagues, setActiveLeagues] = useState(null); // null means all leagues are active
	const [isLeagueFilterOpen, setIsLeagueFilterOpen] = useState(false);

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

	// Toggle league selection for global filtering
	const toggleGlobalLeague = (leagueId) => {
		setActiveLeagues((prev) => {
			// If all leagues are currently shown (prev is null)
			if (prev === null) {
				// Show only the clicked league
				return [leagueId];
			}
			// If some leagues are already selected
			else {
				// Check if this league is already selected
				if (prev.includes(leagueId)) {
					// If it's the only selected league, show all leagues
					if (prev.length === 1) {
						return null;
					}
					// Otherwise, remove this league from selection
					else {
						return prev.filter((id) => id !== leagueId);
					}
				}
				// If this league is not selected, add it
				else {
					return [...prev, leagueId];
				}
			}
		});
	};

	// Reset to show all leagues
	const showAllLeagues = () => {
		setActiveLeagues(null);
	};

	useEffect(() => {
		// If we already have data for the current month and monthOffset is 0, skip fetching
		if (monthOffset === 0 && initialData && activeLeagues === null) {
			setGraphData(initialData);
			setLoading(false);
			return;
		}

		async function loadData() {
			try {
				setLoading(true);
				const events = await fetchEventsData(monthOffset, activeLeagues);
				const processedData = processEventsForGraph(events, monthOffset);
				setGraphData(processedData);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		}

		loadData();
	}, [monthOffset, initialData, activeLeagues]);

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
		<div className='w-full lg:grid lg:grid-cols-2 mx-auto bg-gray-1 rounded-lg overflow-hidden'>
			<div className=''>
				<div className='flex flex-col gap-0'>
					<div className='flex justify-between items-center p-4'>
						<h3 className='text-base font-medium text-white'>
							{monthName} {year}
						</h3>
						<div className='flex gap-1'>
							<button
								onClick={() => setMonthOffset(monthOffset - 1)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white'
								aria-label='Previous month'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<polyline points='15 18 9 12 15 6'></polyline>
								</svg>
							</button>
							<button
								onClick={() => setMonthOffset(0)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white'
								aria-label='Today'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<rect
										x='3'
										y='4'
										width='18'
										height='18'
										rx='2'
										ry='2'></rect>
									<line
										x1='16'
										y1='2'
										x2='16'
										y2='6'></line>
									<line
										x1='8'
										y1='2'
										x2='8'
										y2='6'></line>
									<line
										x1='3'
										y1='10'
										x2='21'
										y2='10'></line>
								</svg>
							</button>
							<button
								onClick={() => setMonthOffset(monthOffset + 1)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white'
								aria-label='Next month'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<polyline points='9 18 15 12 9 6'></polyline>
								</svg>
							</button>
							<button
								onClick={() => setIsLeagueFilterOpen(!isLeagueFilterOpen)}
								className='p-1.5 rounded-md bg-gray-3 hover:bg-gray-4 text-white ml-2'
								aria-label='Filter leagues'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'></polygon>
								</svg>
							</button>
						</div>
					</div>
					{/* League filter dropdown */}
					{isLeagueFilterOpen && (
						<div className='p-4 border-t border-gray-7 bg-gray-2'>
							<div className='flex justify-between items-center mb-2'>
								<h4 className='text-sm font-medium'>Filter Leagues</h4>
								<button
									onClick={showAllLeagues}
									className='text-xs text-blue-9 hover:underline'>
									Show All
								</button>
							</div>
							<div className='flex flex-wrap gap-2 mt-2'>
								{allLeagues.map((league) => {
									const leagueId = `${league.sportId}-${league.id}`;
									const isActive = activeLeagues === null || activeLeagues.includes(leagueId);

									return (
										<button
											key={leagueId}
											onClick={() => toggleGlobalLeague(leagueId)}
											className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-colors ${
												isActive ? "bg-gray-8 text-white" : "bg-gray-3 text-gray-11 hover:bg-gray-5"
											}`}>
											{league.name}
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
						<div className='grid grid-cols-7 gap-0.5 mb-0.5'>
							{weekdays.map((day) => (
								<div
									key={day.key}
									className='text-xs text-gray-11 text-center'>
									{day.label}
								</div>
							))}
						</div>

						<div className='grid grid-cols-7 place-items-center gap-1.5 gap-y-0 aspect-square'>
							{calendarGrid.map((week, weekIndex) => (
								<React.Fragment key={`week-${weekIndex}`}>
									{week.map((day, dayIndex) => {
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
												{/* We're not showing day numbers to match GitHub style */}
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
								<div className='w-3 h-3 bg-gray-7 rounded-sm'></div>
								<span>1-5</span>
							</div>
							<div className='flex items-center gap-1 mr-2'>
								<div className='w-3 h-3 bg-gray-9 rounded-sm'></div>
								<span>6-10</span>
							</div>
							<div className='flex items-center gap-1'>
								<div className='w-3 h-3 bg-gray-11 rounded-sm'></div>
								<span>10+</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Event Details Below Graph */}
			{selectedDay && (
				<EventDetails
					day={selectedDay}
					onClose={() => setSelectedDay(null)}
					allLeagues={allLeagues}
				/>
			)}
		</div>
	);
}

export default ContributionGraph;
