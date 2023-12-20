
export interface $CalendarEvent extends CalendarEvent {
  nOfPreviousConcurrentEvents: number;
  totalConcurrentEvents: number;
  zIndex?: number;
}

export interface Interval {
  index: number;
  startMinutes: number;
  startDate: Date;
  startPixel: number;
  endMinutes: number;
  endDate: Date;
  endPixel: number;
}

export type EventInteraction = "startResize" | "endResize" | "startMove" | "endMove" | "clicked" | "created";
