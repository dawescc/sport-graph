import { Event } from "@/types";
import { FaTrophy, FaRegClock, FaTv } from "react-icons/fa";
import { IoMdRadio } from "react-icons/io";

interface GameProps {
	game: Event;
}

export function CompletedGame({ game }: GameProps) {
	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border border-gray-6/30'>
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.homeTeam?.logo && (
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.homeTeam?.displayName}</span>
					{game.homeScore > game.awayScore && (
						<span className='text-green-10 text-xs font-bold ml-1 flex items-center'>
							<FaTrophy
								className='mr-1'
								size={10}
							/>
							W
						</span>
					)}
				</div>
				<span className='font-bold text-lg'>{game.homeScore}</span>
			</div>

			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.awayTeam?.logo && (
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.awayTeam?.displayName}</span>
					{game.homeScore < game.awayScore && (
						<span className='text-green-10 text-xs font-bold ml-1 flex items-center'>
							<FaTrophy
								className='mr-1'
								size={10}
							/>
							W
						</span>
					)}
				</div>
				<span className='font-bold text-lg'>{game.awayScore}</span>
			</div>

			<div className='mt-2 text-xs text-gray-11 flex items-center justify-between border-t border-gray-6/30 pt-2'>
				<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12'>{game.leagueAbbreviation}</span>
				<span className='flex items-center'>
					<FaRegClock
						className='mr-1'
						size={12}
					/>
					{new Date(game.date).toLocaleDateString("en-US", {
						timeZone: "America/New_York",
					})}
				</span>
			</div>
		</div>
	);
}

export function LiveGame({ game }: GameProps) {
	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border-l-4 border-red-10 border-t border-r border-b border-gray-6/30'>
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.homeTeam?.logo && (
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.homeTeam?.displayName}</span>
				</div>
				<span className='font-bold text-lg'>{game.homeScore}</span>
			</div>

			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.awayTeam?.logo && (
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.awayTeam?.displayName}</span>
				</div>
				<span className='font-bold text-lg'>{game.awayScore}</span>
			</div>

			<div className='mt-2 flex items-center justify-between border-t border-gray-6/30 pt-2'>
				<span className='text-red-10 font-medium text-xs flex items-center'>
					<span className='w-2 h-2 bg-red-10 rounded-full mr-1 animate-pulse'></span>
					LIVE
				</span>
				<div className='flex items-center text-xs text-gray-11'>
					<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12 mr-2'>{game.leagueAbbreviation}</span>
					{game.network && (
						<span className='flex items-center'>
							{game.network.toLowerCase().includes("radio") ? (
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
							{game.network}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

export function FutureGame({ game }: GameProps) {
	return (
		<div className='bg-gray-2 rounded-lg p-4 mb-3 border border-gray-6/30'>
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.homeTeam?.logo && (
						<img
							src={game.homeTeam.logo}
							alt={game.homeTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.homeTeam?.displayName}</span>
				</div>
			</div>

			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center space-x-2'>
					{game.awayTeam?.logo && (
						<img
							src={game.awayTeam.logo}
							alt={game.awayTeam.displayName}
							className='w-6 h-6 object-contain'
							width={24}
							height={24}
						/>
					)}
					<span className='font-medium'>{game.awayTeam?.displayName}</span>
				</div>
			</div>

			<div className='mt-2 flex items-center justify-between border-t border-gray-6/30 pt-2 text-xs'>
				<div className='flex items-center'>
					<span className='bg-gray-3 px-2 py-0.5 rounded-full text-gray-12 mr-2'>{game.leagueAbbreviation}</span>
					{game.network && (
						<span className='flex items-center text-gray-11'>
							{game.network.toLowerCase().includes("radio") ? (
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
							{game.network}
						</span>
					)}
				</div>
				<span className='flex items-center text-blue-10 font-medium'>
					<FaRegClock
						className='mr-1'
						size={12}
					/>
					{new Date(game.date).toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
						timeZone: "America/New_York",
					})}
				</span>
			</div>
		</div>
	);
}
