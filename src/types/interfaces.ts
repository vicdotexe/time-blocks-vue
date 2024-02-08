export interface CalendarEvent {
  id: string | number;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  color?: string;
  readonly?: boolean;
}

export interface $CalendarEvent extends CalendarEvent {
  nOfPreviousConcurrentEvents: number;
  totalConcurrentEvents: number;
  zIndex?: number;
  width: number;
  left: number;
}
