export function processEventsForGraph(events, monthOffset = 0) {
	const today = new Date();
	const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
	const targetMonth = targetDate.getMonth();
	const targetYear = targetDate.getFullYear();
	const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

	const graphData = [];
	for (let day = 1; day <= daysInMonth; day++) {
		graphData.push({
			date: new Date(targetYear, targetMonth, day),
			events: [],
			hasCompletedEvent: false,
			hasFutureEvent: false,
		});
	}

	for (const event of events) {
		const eventDay = event.date.getDate();
		const eventMonth = event.date.getMonth();
		const eventYear = event.date.getFullYear();

		if (eventMonth === targetMonth && eventYear === targetYear) {
			const index = eventDay - 1;
			if (index >= 0 && index < graphData.length) {
				graphData[index].events.push(event);

				if (event.completed) {
					graphData[index].hasCompletedEvent = true;
				} else {
					graphData[index].hasFutureEvent = true;
				}
			}
		}
	}

	return graphData;
}
