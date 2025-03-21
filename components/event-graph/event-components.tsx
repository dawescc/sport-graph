import { Event } from "@/types";
import { format } from "date-fns";
import * as React from "react";
import { FaTrophy, FaRegClock, FaTv } from "react-icons/fa";
import { IoMdRadio } from "react-icons/io";

interface EventCardProps {
	event: Event;
}

/**
 * Base Event Card component that handles all game states
 * Uses discriminated union pattern for different states
 */
export function EventCard({ event }: EventCardProps) {
	// Determine if event is live (estimate based on standard game duration)
	const isLive = !event.completed && new Date() > event.date && new Date() < new Date(event.date.getTime() + 3 * 60 * 60 * 1000);

	// Render appropriate variant based on game status
	if (event.completed) {
		return <CompletedEventCard event={event} />;
	} else if (isLive) {
		return <LiveEventCard event={event} />;
	} else {
		return <FutureEventCard event={event} />;
	}
}

/**
 * Card for completed events showing final scores
 */
function CompletedEventCard({ event }: EventCardProps) {
	const homeWon = Number(event.homeScore) > Number(event.awayScore);
	const awayWon = Number(event.homeScore) < Number(event.awayScore);

	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border border-gray-6/30'>
			{/* Home Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.homeTeam?.logo && (
						<img
							src={event.homeTeam.logo}
							alt={event.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.homeTeam?.displayName}</span>
					{homeWon && (
						<span className='text-green-10 text-xs font-bold ml-1 flex items-center'>
							<FaTrophy
								className='mr-1'
								size={10}
							/>
							W
						</span>
					)}
				</div>
				<span className='font-bold text-lg'>{event.homeScore}</span>
			</div>

			{/* Away Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.awayTeam?.logo && (
						<img
							src={event.awayTeam.logo}
							alt={event.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.awayTeam?.displayName}</span>
					{awayWon && (
						<span className='text-green-10 text-xs font-bold ml-1 flex items-center'>
							<FaTrophy
								className='mr-1'
								size={10}
							/>
							W
						</span>
					)}
				</div>
				<span className='font-bold text-lg'>{event.awayScore}</span>
			</div>

			{/* Footer */}
			<div className='mt-2 text-xs text-gray-11 flex items-center justify-between border-t border-gray-6/30 pt-2'>
				<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12'>{event.leagueAbbreviation}</span>
				<span className='flex items-center'>
					<FaRegClock
						className='mr-1'
						size={12}
					/>
					{format(event.date, "MMM d, yyyy")}
				</span>
			</div>
		</div>
	);
}

/**
 * Card for live events with special styling
 */
function LiveEventCard({ event }: EventCardProps) {
	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border border-gray-6/30'>
			{/* Home Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.homeTeam?.logo && (
						<img
							src={event.homeTeam.logo}
							alt={event.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.homeTeam?.displayName}</span>
				</div>
				<span className='font-bold text-lg'>{event.homeScore}</span>
			</div>

			{/* Away Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.awayTeam?.logo && (
						<img
							src={event.awayTeam.logo}
							alt={event.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.awayTeam?.displayName}</span>
				</div>
				<span className='font-bold text-lg'>{event.awayScore}</span>
			</div>

			{/* Footer */}
			<div className='mt-2 flex items-center justify-between border-t border-gray-6/30 pt-2'>
				<span className='text-red-10 font-medium text-xs flex items-center'>
					<span className='w-2 h-2 bg-red-10 rounded-full mr-1 animate-pulse'></span>
					LIVE
				</span>
				<div className='flex items-center text-xs text-gray-11'>
					<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12 mr-2'>{event.leagueAbbreviation}</span>
					{event.network && (
						<span className='flex items-center'>
							{event.network.toLowerCase().includes("radio") ? (
								<IoMdRadio
									className='mr-1'
									size={12}
								/>
							) : (
								<FaTv
									className='mr-1'
									size={12}
								/>
							)}
							{event.network}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Card for future events
 */
function FutureEventCard({ event }: EventCardProps) {
	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border border-gray-6/30'>
			{/* Home Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.homeTeam?.logo && (
						<img
							src={event.homeTeam.logo}
							alt={event.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.homeTeam?.displayName}</span>
				</div>
			</div>

			{/* Away Team */}
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{event.awayTeam?.logo && (
						<img
							src={event.awayTeam.logo}
							alt={event.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{event.awayTeam?.displayName}</span>
				</div>
			</div>

			{/* Footer */}
			<div className='mt-2 flex items-center justify-between border-t border-gray-6/30 pt-2 text-xs'>
				<div className='flex items-center'>
					<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12 mr-2'>{event.leagueAbbreviation}</span>
					{event.network && (
						<span className='flex items-center text-gray-11'>
							{event.network.toLowerCase().includes("radio") ? (
								<IoMdRadio
									className='mr-1'
									size={12}
								/>
							) : (
								<FaTv
									className='mr-1'
									size={12}
								/>
							)}
							{event.network}
						</span>
					)}
				</div>
				<span className='flex items-center text-blue-10 font-medium'>
					<FaRegClock
						className='mr-1'
						size={12}
					/>
					{format(event.date, "h:mm a")}
				</span>
			</div>
		</div>
	);
}

// Export variants for direct use when needed
export { CompletedEventCard, LiveEventCard, FutureEventCard };
