import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export function getTodayJalaali() {
    const today = new Date();
    return toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
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

