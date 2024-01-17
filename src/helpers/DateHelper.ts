import { addDays, startOfWeek, isWeekend, Day } from "date-fns";

export function getWeekDays(
  date: Date,
  includeWeekends: boolean = true,
  startDayOfWeek: Day = 0
): Date[] {
  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    let day = startOfWeek(date, { weekStartsOn: startDayOfWeek });
    day = addDays(day, i);

    if (!includeWeekends && isWeekend(day)) {
      continue;
    }
    weekDays.push(day);
  }

  return weekDays;
}
