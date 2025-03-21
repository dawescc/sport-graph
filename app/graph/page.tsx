import { Suspense } from "react";
import { fetchEventsData, getLeagues } from "./actions";
import { SportsCalendar } from "@/components/event-graph/event-graph";
import { processEventsForGraph } from "@/lib/process-event-for-graph";

export default async function GraphPage() {
	// Fetch initial data
	const eventsData = await fetchEventsData(0);

	// Process events for the calendar
	const initialData = processEventsForGraph(eventsData, 0);

	return (
		<div className='min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-4xl mx-auto'>
				<h1 className='text-title-large mb-6 text-center'>sport-graph</h1>

				<Suspense fallback={<div className='bg-gray-2 rounded-lg p-8 text-center text-gray-9'>Loading sports calendar...</div>}>
					<SportsCalendar initialData={initialData} />
				</Suspense>

				<div className='py-6 text-center text-gray-9 text-footnote'>Data provided by ESPN API • Updated in real-time</div>
			</div>
		</div>
	);
}
