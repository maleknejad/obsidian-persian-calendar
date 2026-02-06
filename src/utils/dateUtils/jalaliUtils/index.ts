import { toJalaali, toGregorian, jalaaliMonthLength, isValidJalaaliDate } from "jalaali-js";
import { dateToGregorian, weekStartNumber } from "..";
import type { TJalali, TGregorian, TWeekStart, TGetDayOfWeek } from "src/types";

export function checkValidJalali(jy: number, jm: number, jd: number) {
	return isValidJalaaliDate(jy, jm, jd);
}

export function checkKabiseh(jy: number): boolean {
	return jalaaliMonthLength(jy, 12) === 30;
}

export function dateToJalali(date: Date): TJalali {
	return toJalaali(date);
}

export function jalaliToDate(jy: number, jm: number, jd: number): Date {
	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	return new Date(gy, gm - 1, gd);
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): TGregorian {
	return toGregorian(jy, jm, jd);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): TJalali {
	const { jy, jm, jd } = toJalaali(gy, gm, gd);
	return { jy, jm, jd };
}

export function jalaliMonthLength(jy: number, jm: number): number {
	return jalaaliMonthLength(jy, jm);
}

export function getDaysInJalaliYear(jy: number): number {
	return jalaliMonthLength(jy, 12) === 30 ? 366 : 365;
}

function weekNumber(targetDate: Date, firstDayOfYear: Date, weekStart: TWeekStart): number {
	// normalize
	targetDate.setHours(0, 0, 0, 0);
	firstDayOfYear.setHours(0, 0, 0, 0);

	// diff days
	const diffInDays = Math.floor(
		(targetDate.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24),
	);

	// JS weekday: 0=Sun ... 6=Sat
	const firstWeekday = firstDayOfYear.getDay();

	// align week start
	const offset = (firstWeekday - weekStartNumber(weekStart) + 7) % 7;

	return Math.ceil((diffInDays + offset + 1) / 7);
}

export function dateToJWeekNumber(date: Date, weekStart: TWeekStart = "sat"): number {
	const { jy } = dateToJalali(date);
	const { gy, gm, gd } = jalaliToGregorian(jy, 1, 1);

	const firstDayOfYear = new Date(gy, gm - 1, gd);

	return weekNumber(date, firstDayOfYear, weekStart);
}

export function jalaliToJWeekNumber(
	jy: number,
	jm: number,
	jd: number,
	weekStart: TWeekStart = "sat",
): number {
	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	const targetDate = new Date(gy, gm - 1, gd);

	const firstDayGregorian = jalaliToGregorian(jy, 1, 1);
	const firstDayOfYear = new Date(
		firstDayGregorian.gy,
		firstDayGregorian.gm - 1,
		firstDayGregorian.gd,
	);

	return weekNumber(targetDate, firstDayOfYear, weekStart);
}

export function getFirstWeekStartOfJYear(jy: number, weekStart: TWeekStart = "sat"): TJalali {
	const { gy, gm, gd } = jalaliToGregorian(jy, 1, 1);
	const firstDayOfYear = new Date(gy, gm - 1, gd);

	// JS weekday: 0=Sun, 1=Mon, ... , 6=Sat
	const firstWeekday = firstDayOfYear.getDay();

	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const firstWeekStart = new Date(firstDayOfYear);
	firstWeekStart.setDate(firstWeekStart.getDate() + offset);

	return dateToJalali(firstWeekStart);
}

export function jalaliToStartDayOfWeek(
	{ jYear, jWeekNumber }: TGetDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const { gy, gm, gd } = jalaliToGregorian(jYear, 1, 1);
	const firstDayOfYear = new Date(gy, gm - 1, gd);

	// JS weekday: 0=Sun, 1=Mon, ... , 6=Sat
	const firstDayWeekday = firstDayOfYear.getDay();
	const weekStartNum = weekStartNumber(weekStart);

	let daysToAdd = weekStartNum - firstDayWeekday;
	if (daysToAdd < 0) daysToAdd += 7;

	const firstWeekStartDate = new Date(firstDayOfYear);
	firstWeekStartDate.setDate(firstDayOfYear.getDate() + daysToAdd);

	if (daysToAdd > 0) {
		firstWeekStartDate.setDate(firstWeekStartDate.getDate() - 7);
	}

	const targetDate = new Date(firstWeekStartDate);
	targetDate.setDate(firstWeekStartDate.getDate() + (jWeekNumber - 1) * 7);

	return { ...dateToJalali(targetDate), ...dateToGregorian(targetDate) };
}

export function jalaliToEndDayOfWeek(
	{ jYear, jWeekNumber }: TGetDayOfWeek,
	weekStart: TWeekStart = "sat",
): TJalali & TGregorian {
	const { gy, gm, gd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber }, weekStart);

	let targetDate = new Date(gy, gm - 1, gd);

	targetDate.setDate(targetDate.getDate() + 6);

	return { ...dateToJalali(targetDate), ...dateToGregorian(targetDate) };
}
