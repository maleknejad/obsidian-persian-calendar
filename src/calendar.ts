import { toJalaali, toGregorian, isValidJalaaliDate, jalaaliMonthLength } from 'jalaali-js';

export function getTodayJalaali() {
    const today = new Date();
    return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

export function changeMonth(currentYear: number, currentMonth: number, offset: number): { year: number, month: number } {
    let newYear = currentYear;
    let newMonth = currentMonth + offset;

    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }

    // Ensure the new date is valid, considering leap years etc.
    if (!isValidJalaaliDate(newYear, newMonth, 1)) {
        // Adjust newYear or newMonth as needed if the date is not valid
        // For example, if offsetting into a leap year
    }

    return { year: newYear, month: newMonth };
}

export function getMonthDays(year: number, month: number): number[] {
    const lengthOfMonth = jalaaliMonthLength(year, month);
    return Array.from({ length: lengthOfMonth }, (_, i) => i + 1);
}


export function getFirstDayOfWeek(year: number, month: number): number {
    // Get the first day of the Jalaali month
    const { gy, gm, gd } = toGregorian(year, month, 1);
    const firstDayDate = new Date(gy, gm - 1, gd);
    // Convert the day to the Jalaali week, where Saturday is 0
    return (firstDayDate.getDay() + 1) % 7; // Assuming Sunday is 0 in getDay
}

