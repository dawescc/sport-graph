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
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "America/New_York", // Use your preferred timezone
			year: "numeric",
			month: "numeric",
			day: "numeric",
		});

		const parts = formatter.formatToParts(new Date(event.date));
		const eventDay = parseInt(parts.find((part) => part.type === "day").value);
		const eventMonth = parseInt(parts.find((part) => part.type === "month").value) - 1; // JS months are 0-indexed
		const eventYear = parseInt(parts.find((part) => part.type === "year").value);

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
