import { fetchEventsData, getLeagues } from "./actions";
import ContributionGraph from "@/components/event-graph/event-graph";
import { processEventsForGraph } from "@/components/event-graph/process-event-for-graph";

export default async function Home() {
	const [eventsData] = await Promise.all([fetchEventsData(0), getLeagues()]);

	const initialData = processEventsForGraph(eventsData, 0);

	return (
		<div className='pt-20 pb-10'>
			<ContributionGraph initialData={initialData} />
		</div>
	);
}
