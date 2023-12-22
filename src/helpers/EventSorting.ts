import { $CalendarEvent } from "../types/interfaces";

export function processConcurrency(events: $CalendarEvent[]) {
  if (!events.length) return events;

  events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  events.forEach((event) => {
    event.nOfPreviousConcurrentEvents = 0;
    event.totalConcurrentEvents = 0;
  });

  for (const [index, currentEvent] of events.entries()) {
    for (let i = 0; i < index; i++) {
      if (events[i].endDate > currentEvent.startDate) {
        currentEvent.nOfPreviousConcurrentEvents++;
      }
    }

    let nOfUpcomingConcurrentEvents = 0;
    for (let i = index + 1; i < events.length; i++) {
      if (events[i].startDate < currentEvent.endDate) {
        nOfUpcomingConcurrentEvents++;
      }
    }

    currentEvent.totalConcurrentEvents =
      currentEvent.nOfPreviousConcurrentEvents +
      nOfUpcomingConcurrentEvents +
      1;
  }

  let z = 0;
  events.forEach((event) => {
    event.zIndex = z++;
  });

  return events;
}
