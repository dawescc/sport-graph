import { Event, GraphDay } from "@/types";

export function processEventsForGraph(events: Event[], monthOffset = 0): GraphDay[] {
	const today = new Date();
	const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
	const targetMonth = targetDate.getMonth();
	const targetYear = targetDate.getFullYear();
	const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

	// Initialize the graph data array with empty days
	const graphData: GraphDay[] = Array.from({ length: daysInMonth }, (_, i) => {
		// Create a date for this day
		const date = new Date(targetYear, targetMonth, i + 1, 12, 0, 0);

		return {
			date,
			events: [],
			hasCompletedEvent: false,
			hasFutureEvent: false,
		};
	});

	// Process events in a single pass - O(n) time complexity
	for (const event of events) {
		const eventDate = new Date(event.date);

		// Check if event is in the target month
		if (eventDate.getMonth() === targetMonth && eventDate.getFullYear() === targetYear) {
			const dayIndex = eventDate.getDate() - 1;

			if (dayIndex >= 0 && dayIndex < graphData.length) {
				graphData[dayIndex].events.push(event);

				if (event.completed) {
					graphData[dayIndex].hasCompletedEvent = true;
				} else {
					graphData[dayIndex].hasFutureEvent = true;
				}
			}
		}
	}

	return graphData;
}
