import {
	PersianCalendar,
	GregorianCalendar,
	CalendarDate,
	toCalendar,
} from "@internationalized/date";
import {
	dateToGregorian,
	getWeekdayTehran,
	getJalaliMonthName,
	jalaliToSeason,
	weekStartNumber,
	getSeasonName,
} from "..";
import type { TJalali, TGregorian, TWeekStart, TGetDayOfWeek } from "src/types";


//? --- Core ---
const persian = new PersianCalendar();
const gregorian = new GregorianCalendar();

// CD = Calendar-Date in @internationalized/date
function dateToGregorianCD(date: Date): CalendarDate {
	const { gy, gm, gd } = dateToGregorian(date);
	return new CalendarDate(gy, gm, gd);
}

function calendarDateToUTCDate(cd: CalendarDate): Date {
	const g = cd.calendar.identifier === "gregory" ? cd : toCalendar(cd, gregorian);
	return new Date(Date.UTC(g.year, g.month - 1, g.day, 12, 0, 0));
}

function daysBetween(from: Date, to: Date): number {
	return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function weekNumber(targetDate: Date, firstDayOfYear: Date, weekStart: TWeekStart): number {
	const diffInDays = daysBetween(firstDayOfYear, targetDate);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (firstWeekday - weekStartNumber(weekStart) + 7) % 7;
	return Math.ceil((diffInDays + offset + 1) / 7);
}

//? --- Main ---
export function checkValidJalali(jy: number, jm: number, jd: number): boolean {
	if (jm < 1 || jm > 12 || jd < 1) return false;
	try {
		const maxDays = persian.getDaysInMonth(new CalendarDate(persian, jy, jm, 1));
		return jd <= maxDays;
	} catch {
		return false;
	}
}

export function checkKabiseh(jy: number): boolean {
	return persian.getDaysInMonth(new CalendarDate(persian, jy, 12, 1)) === 30;
}

export function dateToJalali(date: Date): TJalali {
	const jcd = toCalendar(dateToGregorianCD(date), persian);
	return { jy: jcd.year, jm: jcd.month, jd: jcd.day };
}

export function jalaliToDate(jy: number, jm: number, jd: number): Date {
	return calendarDateToUTCDate(new CalendarDate(persian, jy, jm, jd));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): TGregorian {
	const gcd = toCalendar(new CalendarDate(persian, jy, jm, jd), gregorian);
	return { gy: gcd.year, gm: gcd.month, gd: gcd.day };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): TJalali {
	const jcd = toCalendar(new CalendarDate(gy, gm, gd), persian);
	return { jy: jcd.year, jm: jcd.month, jd: jcd.day };
}

export function jalaliMonthLength(jy: number, jm: number): number {
	return persian.getDaysInMonth(new CalendarDate(persian, jy, jm, 1));
}

export function getDaysInJalaliYear(jy: number): number {
	let totalDays = 0;
	for (let month = 1; month <= 12; month++) {
		totalDays += persian.getDaysInMonth(new CalendarDate(persian, jy, month, 1));
	}
	return totalDays;
}

export function dateToJWeekNumber(date: Date, weekStart: TWeekStart = "sat"): number {
	const { jy } = dateToJalali(date);
	return weekNumber(date, jalaliToDate(jy, 1, 1), weekStart);
}

export function jalaliToJWeekNumber(
	jy: number,
	jm: number,
	jd: number,
	weekStart: TWeekStart = "sat",
): number {
	return weekNumber(jalaliToDate(jy, jm, jd), jalaliToDate(jy, 1, 1), weekStart);
}

export function getFirstWeekStartOfJYear(jy: number, weekStart: TWeekStart = "sat"): TJalali {
	const firstDayOfYear = jalaliToDate(jy, 1, 1);
	const firstWeekday = getWeekdayTehran(firstDayOfYear);
	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const result = new CalendarDate(persian, jy, 1, 1).add({ days: offset });
	return { jy: result.year, jm: result.month, jd: result.day };
}

export function jalaliToStartDayOfWeek(
	{ jYear, jWeekNumber }: TGetDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const firstDayOfYear = jalaliToDate(jYear, 1, 1);
	const firstDayWeekday = getWeekdayTehran(firstDayOfYear);
	const weekStartNum = weekStartNumber(weekStart);

	let daysToAdd = weekStartNum - firstDayWeekday;
	if (daysToAdd < 0) daysToAdd += 7;
	if (daysToAdd > 0) daysToAdd -= 7;

	const { gy, gm, gd } = jalaliToGregorian(jYear, 1, 1);
	const firstGCD = new CalendarDate(gy, gm, gd);
	const targetGCD = firstGCD.add({ days: daysToAdd + (jWeekNumber - 1) * 7 });
	const targetJCD = toCalendar(targetGCD, persian);

	return {
		jy: targetJCD.year,
		jm: targetJCD.month,
		jd: targetJCD.day,
		gy: targetGCD.year,
		gm: targetGCD.month,
		gd: targetGCD.day,
	};
}

export function jalaliToEndDayOfWeek(
	{ jYear, jWeekNumber }: TGetDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const { gy, gm, gd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber }, weekStart);

	const startGCD = new CalendarDate(gy, gm, gd);
	const endGCD = startGCD.add({ days: 6 });
	const endJCD = toCalendar(endGCD, persian);

	return {
		jy: endJCD.year,
		jm: endJCD.month,
		jd: endJCD.day,
		gy: endGCD.year,
		gm: endGCD.month,
		gd: endGCD.day,
	};
}

export function dateToMonthName(date: Date) {
	const { jm } = dateToJalali(date);
	return getJalaliMonthName(jm);
}

export function dateToSeasonName(date: Date) {
	const { jm } = dateToJalali(date);
	return getSeasonName(jalaliToSeason(jm));
}

export function dateToStartDayOfJMonthDate(date: Date): Date {
	const { jy, jm } = dateToJalali(date);
	return jalaliToDate(jy, jm, 1);
}

export function dateToEndDayOfJMonthDate(date: Date): Date {
	const { jy, jm } = dateToJalali(date);
	return jalaliToDate(jy, jm, jalaliMonthLength(jy, jm));
}

export function dateToStartDayOfSeasonDate(date: Date): Date {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	return jalaliToDate(jy, 3 * (season - 1) + 1, 1);
}

export function dateToEndDayOfSeasonDate(date: Date): Date {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	const lastMonthOfSeason = 3 * season;
	return jalaliToDate(jy, lastMonthOfSeason, jalaliMonthLength(jy, lastMonthOfSeason));
}

export function dateToDayOfMonth(date: Date): number {
	return dateToJalali(date).jd;
}

export function dateToDaysPassedJYear(date: Date): number {
	const { jy, jm, jd } = dateToJalali(date);
	let daysPassed = 0;
	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month);
	}
	return daysPassed + jd;
}

export function dateToDaysRemainingJYear(date: Date): number {
	return getDaysInJalaliYear(dateToJalali(date).jy) - dateToDaysPassedJYear(date);
}

export function dateToDaysPassedSeason(date: Date): number {
	const { jy, jm, jd } = dateToJalali(date);
	const startMonth = (jalaliToSeason(jm) - 1) * 3 + 1;
	let daysPassed = 0;
	for (let m = startMonth; m < jm; m++) {
		daysPassed += jalaliMonthLength(jy, m);
	}
	return daysPassed + jd;
}

export function dateToDaysRemainingSeason(date: Date): number {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);
	const startMonth = (season - 1) * 3 + 1;
	const endMonth = startMonth + 2;

	let seasonLength = 0;
	for (let m = startMonth; m <= endMonth; m++) {
		seasonLength += jalaliMonthLength(jy, m);
	}

	return seasonLength - dateToDaysPassedSeason(date);
}

export function dateToDaysPassedJMonth(date: Date): number {
	return dateToJalali(date).jd;
}

export function dateToDaysRemainingJMonth(date: Date): number {
	const { jy, jm, jd } = dateToJalali(date);
	return jalaliMonthLength(jy, jm) - jd;
}
