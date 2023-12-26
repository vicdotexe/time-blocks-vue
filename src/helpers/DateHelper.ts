import { addDays, startOfWeek, isWeekend, Day } from "date-fns";

export function getWeekRange(
  date: Date | string,
  startDayOfWeek: number = 0
): { start: Date; end: Date } {
  if (typeof date == typeof "string") {
    date = new Date(date + "T00:00:00");
  }
  const startDate = new Date(date);
  const endDate = new Date(date);
  // Calculate the difference from the start day of the week
  let dayDifference = startDate.getDay() - startDayOfWeek;

  // Correct the day difference if the day is before the start day of the week
  if (dayDifference < 0) {
    dayDifference += 7;
  }

  // Adjust the start and end dates
  startDate.setDate(startDate.getDate() - dayDifference);
  endDate.setDate(startDate.getDate() + 6);

  // Ensure start and end dates are at the beginning and end of their respective days
  startDate.setHours(0, 0, 0, 0); // Set to start of the day
  endDate.setHours(23, 59, 59, 999); // Set to end of the day

  return { start: startDate, end: endDate };
}

export function getWeekDays(
  date: Date | string,
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

export function mergeTime(date: Date, time: Date) {
  const newDate = new Date(date);
  newDate.setHours(time.getHours());
  newDate.setMinutes(time.getMinutes());
  newDate.setSeconds(time.getSeconds());
  newDate.setMilliseconds(time.getMilliseconds());
  return newDate;
}
