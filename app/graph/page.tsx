import { Suspense } from "react";
import { fetchEventsData, getLeagues } from "./actions";
import ContributionGraph from "@/components/event-graph/event-graph";
import { processEventsForGraph } from "@/lib/process-event-for-graph";

export default async function GraphPage() {
	// Fetch initial data in parallel
	const [eventsData, leagues] = await Promise.all([fetchEventsData(0), getLeagues()]);

	// Process events for the graph
	const initialData = processEventsForGraph(eventsData, 0);

	return (
		<div className='min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-7xl mx-auto'>
				<h1 className='text-3xl font-bold text-white mb-8 text-center'>Sports Calendar</h1>
				<Suspense fallback={<div className='bg-gray-800 rounded-lg p-8 text-center text-gray-400'>Loading sports calendar...</div>}>
					<ContributionGraph initialData={initialData} />
				</Suspense>
				<div className='mt-8 text-center text-gray-500 text-sm'>Data provided by ESPN API • Updated in real-time</div>
			</div>
		</div>
	);
}
