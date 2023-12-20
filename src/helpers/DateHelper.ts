export function getWeekRange(date: Date | string, startDayOfWeek: number = 0): { start: Date; end: Date } {
    if (typeof date == typeof "string"){
        date = new Date(date +'T00:00:00');
    }
    const startDate = new Date(date);
    const endDate = new Date(date);
    // Calculate the difference from the start day of the week
    let dayDifference = startDate.getDay() - startDayOfWeek;

    // Correct the day difference if the day is before the start day of the week
    if (dayDifference < 0) {
        dayDifference += 7;
    }
    console.log(dayDifference);

    // Adjust the start and end dates
    startDate.setDate(startDate.getDate() - dayDifference);
    endDate.setDate(startDate.getDate() + 6);

    // Ensure start and end dates are at the beginning and end of their respective days
    startDate.setHours(0, 0, 0, 0); // Set to start of the day
    endDate.setHours(23, 59, 59, 999); // Set to end of the day

    return { start: startDate, end: endDate };
}

export function getWeekDays(date: Date | string, startDayOfWeek: number = 0): Date[] {
    // Convert string to Date if necessary
    if (typeof date === "string") {
        date = new Date(date + 'T00:00:00');
    }

    const startDate = new Date(date);

    // Calculate the difference from the start day of the week
    let dayDifference = startDate.getDay() - startDayOfWeek;

    // Correct the day difference if the day is before the start day of the week
    if (dayDifference < 0) {
        dayDifference += 7;
    }

    // Adjust the start date to the beginning of the week
    startDate.setDate(startDate.getDate() - dayDifference);
    startDate.setHours(0, 0, 0, 0); // Start of the first day of the week

    // Create an array to hold all the days of the week
    const weekDays = [];

    // Loop to fill the array with each day of the week
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        weekDays.push(day);
    }

    return weekDays;
}