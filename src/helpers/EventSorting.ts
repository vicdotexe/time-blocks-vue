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

export function calculatePositions(events: $CalendarEvent[]): $CalendarEvent[] {
  // Sort events by start time.
  events.sort((a, b) => a.startDate.getTime() - b.endDate.getTime());

  // This will hold the currently active events at any given time.
  let activeEvents: $CalendarEvent[] = [];

  // Process each event to determine its width and position.
  events.forEach((event) => {
    // Remove events that have ended.
    activeEvents = activeEvents.filter((e) => e.endDate > event.startDate);

    // Add the current event to the active list.
    activeEvents.push(event);

    // Adjust the positions and widths of active events.
    adjustActiveEvents(activeEvents);
  });

  return events;
}

// Adjust the positions and widths of active events.
function adjustActiveEvents(activeEvents: $CalendarEvent[]) {
  // The width each event will occupy.
  let widthPerEvent = 100 / Math.max(activeEvents.length, 1);

  activeEvents.forEach((event, index) => {
    // Assign the width and the left position.

    event.left = index * widthPerEvent;

    event.width = widthPerEvent;
  });
}
