export interface CalendarEvent {
  id: string | number;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  color?: string;
}

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
