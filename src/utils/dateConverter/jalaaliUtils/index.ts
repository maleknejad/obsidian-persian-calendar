import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { weekStartNumber } from "..";
import { JalaliType, GregorianType, WeekStartType, getWeekStartDatePraps } from "src/types";

// => (now){jy, jm, jd}
export function getJalaliNow(): JalaliType {
	return toJalaali(new Date());
}

// (jy) => (Is it a leap year?)true|false
export function isKabiseh(jy: number): boolean {
	return jalaaliMonthLength(jy, 12) === 30;
}

// (jy, jm, jd) => {gy, gm, gd}
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianType {
	return toGregorian(jy, jm, jd);
}

// (gy, gm, gd) => {jy, jm, jd}
export function gregorianToJalali(
	gy: number,
	gm: number,
	gd: number,
): { jy: number; jm: number; jd: number } {
	const { jy, jm, jd } = toJalaali(gy, gm, gd);
	return { jy, jm, jd };
}

// ("gy-gm-gd") => {jy, jm, jd}
export function gregorianDashToJalali(dateStr: string): JalaliType | null {
	const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	// Validate actual Gregorian date
	const date = new Date(gy, gm - 1, gd);

	if (date.getFullYear() !== gy || date.getMonth() !== gm - 1 || date.getDate() !== gd) {
		return null;
	}

	return toJalaali(gy, gm, gd);
}

// ("gy-gm-gd") => "jy-jm-jd"
export function gregorianDashToJalaliDash(dateStr: string): string | null {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	const date = new Date(gy, gm - 1, gd);
	if (date.getFullYear() !== gy || date.getMonth() !== gm - 1 || date.getDate() !== gd) {
		return null;
	}

	const j = toJalaali(gy, gm, gd);
	return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

// ("jy-jm-jd") => "gy-gm-gd"
export function jalaliDashToGregorianDash(dateStr: string): string | null {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	try {
		const g = toGregorian(jy, jm, jd);
		return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
	} catch {
		return null;
	}
}

//todo: remove this in the end
// convert jalali or gregorian dash date
export function convertDashDate(dateStr: string): string {
	const year = Number(dateStr.slice(0, 4));
	if (Number.isNaN(year)) return dateStr;

	if (year > 1600) {
		return gregorianDashToJalaliDash(dateStr) ?? dateStr;
	}

	return jalaliDashToGregorianDash(dateStr) ?? dateStr;
}

// exp: (1404, 12) => 29
export function jalaliMonthLength(jy: number, jm: number): number {
	return jalaaliMonthLength(jy, jm);
}

// (jy, jm, jd) => Date
export function jalaliToDate(jy: number, jm: number, jd: number): Date {
	const { gy, gm, gd } = toGregorian(jy, jm, jd);
	return new Date(gy, gm - 1, gd);
}

// (month_number) => quarter_number
export function getQuarter(month: number): number {
	return Math.ceil(month / 3);
}

// => (now){quarter, jy}
export function getCurrentQuarter(): { quarter: number; jy: number } {
	const { jy, jm } = getJalaliNow();
	return {
		jy,
		quarter: getQuarter(jm),
	};
}

// Date => jalali_week_number
export function getJalaliWeekNumber(date: Date, weekStart: WeekStartType = "sat"): number {
	// Normalize to midnight to ignore hours/minutes
	const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	// Convert to Jalali year
	const { jy } = toJalaali(targetDate);

	// First day of Jalali year in Gregorian
	const { gy, gm, gd } = toGregorian(jy, 1, 1);
	const firstDayOfYear = new Date(gy, gm - 1, gd);

	// Difference in full days from first day of year
	const diffInDays = Math.floor(
		(targetDate.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24),
	);

	// JS weekday: 0=Sun, 1=Mon, ... , 6=Sat
	const firstWeekdayOfYear = firstDayOfYear.getDay();

	// align with weekStart
	const dayOfWeekIndex = (firstWeekdayOfYear - weekStartNumber(weekStart) + 7) % 7;

	// counting first partial week as week 1
	return Math.ceil((diffInDays + dayOfWeekIndex + 1) / 7);
}

// (jy) => (first saturday in jy){jy, jm, jd}
export function getFirstWeekStartOfYear(jy: number, weekStart: WeekStartType = "sat"): JalaliType {
	const { gy, gm, gd } = toGregorian(jy, 1, 1);
	const firstDayOfYear = new Date(gy, gm - 1, gd);

	// JS weekday: 0=Sun, 1=Mon, ... , 6=Sat
	const firstWeekday = firstDayOfYear.getDay();

	const offset = (weekStartNumber(weekStart) - firstWeekday + 7) % 7;

	const firstWeekStart = new Date(firstDayOfYear);
	firstWeekStart.setDate(firstWeekStart.getDate() + offset);

	return toJalaali(firstWeekStart);
}

// ({jYear, jWeekNumber}) => (start day of week){jy, jm, jd}
export function getJalaliStartDayOfWeek(
	{ jYear, jWeekNumber }: getWeekStartDatePraps,
	weekStart: WeekStartType = "sat",
): JalaliType {
	const { gy, gm, gd } = toGregorian(jYear, 1, 1);
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

	return toJalaali(targetDate);
}

// ({jYear, jWeekNumber}) => (end day of week){jy, jm, jd}
export function getJalaliEndDayOfWeek(
	{ jYear, jWeekNumber }: getWeekStartDatePraps,
	weekStart: WeekStartType = "sat",
): JalaliType {
	// Get start date of the requested Jalali week
	const { jy, jm, jd } = getJalaliStartDayOfWeek({ jYear, jWeekNumber }, weekStart);

	const { gy, gm, gd } = toGregorian(jy, jm, jd);
	const startDate = new Date(gy, gm - 1, gd);

	// Week end is always 6 days after week start
	startDate.setDate(startDate.getDate() + 6);

	return toJalaali(startDate);
}

// (from:{jy, jm, jd}, to:{jy, jm, jd}) => diff_days
export function daysBetweenJalaali(
	from: { jy: number; jm: number; jd: number },
	to: { jy: number; jm: number; jd: number },
): number {
	const fromGregorian = toGregorian(from.jy, from.jm, from.jd);
	const toGregorianDate = toGregorian(to.jy, to.jm, to.jd);
	const fromDate = new Date(fromGregorian.gy, fromGregorian.gm - 1, fromGregorian.gd);
	const toDate = new Date(toGregorianDate.gy, toGregorianDate.gm - 1, toGregorianDate.gd);
	const timeDiff = toDate.getTime() - fromDate.getTime();
	return Math.floor(timeDiff / (1000 * 3600 * 24));
}

// (jy, jm, jd) => Number(days_passed_in_jy)
export function getDaysPassedInYear(jy: number, jm: number, jd: number): number {
	return daysBetweenJalaali({ jy, jm: 1, jd: 1 }, { jy, jm, jd }) + 1;
}

// (jy, jm, jd) => Number(days_remaining_in_jy)
export function getDaysRemainingInYear(jy: number, jm: number, jd: number): number {
	const lastDay = jalaaliMonthLength(jy, 12);
	return daysBetweenJalaali({ jy, jm, jd }, { jy, jm: 12, jd: lastDay });
}
