import { $CalendarEvent } from '../types/interfaces';

export default class EventConcurrency {
    protected sortEventsAccordingToStartOfTime(events: $CalendarEvent[]) {
      return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }
  
    calculateConcurrencyForEvents(events: $CalendarEvent[]) {
      const updatedEvents = this.sortEventsAccordingToStartOfTime(events);
      if (!updatedEvents.length) return [];
  
      updatedEvents.forEach(event => {
        event.nOfPreviousConcurrentEvents = 0;
        event.totalConcurrentEvents = 0;
      });
  
      for (const [index, currentEvent] of updatedEvents.entries()) {
        for (let i = 0; i < index; i++) {
          if (updatedEvents[i].endDate > currentEvent.startDate) {
            currentEvent.nOfPreviousConcurrentEvents++;
          }
        }
  
        let nOfUpcomingConcurrentEvents = 0;
        for (let i = index + 1; i < updatedEvents.length; i++) {
          if (updatedEvents[i].startDate < currentEvent.endDate) {
            nOfUpcomingConcurrentEvents++;
          }
        }
  
        currentEvent.totalConcurrentEvents =
          currentEvent.nOfPreviousConcurrentEvents + nOfUpcomingConcurrentEvents + 1; // Including the event itself
      }
  
      return updatedEvents;
    }
}