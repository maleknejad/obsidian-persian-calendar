import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { weekStartNumber } from "..";
import type { TJalali, TGregorian, TWeekStart, TGetWeekStartDatePraps } from "src/types";

export function isKabiseh(jy: number): boolean {
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

export function gregorianToJalali(
	gy: number,
	gm: number,
	gd: number,
): { jy: number; jm: number; jd: number } {
	const { jy, jm, jd } = toJalaali(gy, gm, gd);
	return { jy, jm, jd };
}

export function jalaliMonthLength(jy: number, jm: number): number {
	return jalaaliMonthLength(jy, jm);
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
	const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const { jy } = dateToJalali(targetDate);
	const { gy, gm, gd } = jalaliToGregorian(jy, 1, 1);

	const firstDayOfYear = new Date(gy, gm - 1, gd);

	return weekNumber(targetDate, firstDayOfYear, weekStart);
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

export function getJStartDayOfWeek(
	{ jYear, jWeekNumber }: TGetWeekStartDatePraps,
	weekStart: TWeekStart = "sat",
): TJalali {
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

	return dateToJalali(targetDate);
}

export function getJalaliEndDayOfWeek(
	{ jYear, jWeekNumber }: TGetWeekStartDatePraps,
	weekStart: TWeekStart = "sat",
): TJalali {
	// Get start date of the requested Jalali week
	const { jy, jm, jd } = getJStartDayOfWeek({ jYear, jWeekNumber }, weekStart);

	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	const startDate = new Date(gy, gm - 1, gd);

	// Week end is always 6 days after week start
	startDate.setDate(startDate.getDate() + 6);

	return dateToJalali(startDate);
}

function daysBetweenJalali(
	from: { jy: number; jm: number; jd: number },
	to: { jy: number; jm: number; jd: number },
): number {
	const fromGregorian = jalaliToGregorian(from.jy, from.jm, from.jd);
	const toGregorianDate = jalaliToGregorian(to.jy, to.jm, to.jd);
	const fromDate = new Date(fromGregorian.gy, fromGregorian.gm - 1, fromGregorian.gd);
	const toDate = new Date(toGregorianDate.gy, toGregorianDate.gm - 1, toGregorianDate.gd);
	const timeDiff = toDate.getTime() - fromDate.getTime();
	return Math.floor(timeDiff / (1000 * 3600 * 24));
}

export function getDaysPassedJYear(jy: number, jm: number, jd: number): number {
	return daysBetweenJalali({ jy, jm: 1, jd: 1 }, { jy, jm, jd }) + 1;
}

export function getDaysRemainingJYear(jy: number, jm: number, jd: number): number {
	const lastDay = jalaaliMonthLength(jy, 12);
	return daysBetweenJalali({ jy, jm, jd }, { jy, jm: 12, jd: lastDay });
}
