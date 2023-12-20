export interface CalendarEvent {
    id: string | number;
    description?: string;
    startDate: Date;
    endDate: Date;
    color?: string;
  }