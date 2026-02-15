import { toJalaali, toGregorian, jalaaliMonthLength, isValidJalaaliDate } from "jalaali-js";
import {
	dateToGregorian,
	getJalaliMonthName,
	jalaliToSeason,
	weekStartNumber,
	getSeasonName,
} from "..";
import type { TJalali, TGregorian, TWeekStart, TGetDayOfWeek } from "src/types";

export function checkValidJalali(jy: number, jm: number, jd: number) {
	return isValidJalaaliDate(jy, jm, jd);
}

export function checkKabiseh(jy: number): boolean {
	return jalaaliMonthLength(jy, 12) === 30;
}

export function dateToJalali(date: Date): TJalali {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Tehran",
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(date);

	const year = Number(parts.find((p) => p.type === "year")!.value);
	const month = Number(parts.find((p) => p.type === "month")!.value);
	const day = Number(parts.find((p) => p.type === "day")!.value);

	return toJalaali(year, month, day);
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

export function jalaliMonthLength(jy: number, jm: number) {
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

export function dateToMonthName(date: Date) {
	const { jm } = dateToJalali(date);
	return getJalaliMonthName(jm);
}

export function dateToSeasonName(date: Date) {
	const { jm } = dateToJalali(date);
	const seasonNumber = jalaliToSeason(jm);

	return getSeasonName(seasonNumber);
}

export function dateToStartDayOfJMonthDate(date: Date) {
	const { jy, jm } = dateToJalali(date);
	return jalaliToDate(jy, jm, 1);
}

export function dateToEndDayOfJMonthDate(date: Date) {
	const { jy, jm } = dateToJalali(date);
	return jalaliToDate(jy, jm, jalaliMonthLength(jy, jm));
}

export function dateToStartDayOfSeasonDate(date: Date) {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	const firstMonthOfSeason = 3 * (season - 1) + 1;

	return jalaliToDate(jy, firstMonthOfSeason, 1);
}

export function dateToEndDayOfSeasonDate(date: Date) {
	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	const lastMonthOfSeason = 3 * season;

	return jalaliToDate(jy, lastMonthOfSeason, jalaliMonthLength(jy, jm));
}

export function dateToDayOfMonth(date: Date) {
	const { jd } = dateToJalali(date);
	return jd;
}

export function dateToDaysPassedJYear(date: Date) {
	const { jy, jm, jd } = dateToJalali(date);

	let daysPassed = 0;

	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month)!;
	}

	return daysPassed + jd;
}

export function dateToDaysRemainingJYear(date: Date) {
	const { jy, jm, jd } = dateToJalali(date);

	let daysPassed = 0;

	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month)!;
	}

	daysPassed += jd;

	return getDaysInJalaliYear(jy) - daysPassed;
}

export function dateToDaysPassedSeason(date: Date) {
	const { jy, jm, jd } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	const startMonth = (season - 1) * 3 + 1;

	let daysPassed = 0;

	for (let m = startMonth; m < jm; m++) {
		daysPassed += jalaliMonthLength(jy, m)!;
	}

	return daysPassed + jd;
}

export function dateToDaysRemainingSeason(date: Date) {
	const { jy, jm, jd } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	const startMonth = (season - 1) * 3 + 1;
	const endMonth = startMonth + 2;

	let daysPassed = 0;
	for (let m = startMonth; m < jm; m++) {
		daysPassed += jalaliMonthLength(jy, m)!;
	}
	daysPassed += jd;

	let seasonLength = 0;
	for (let m = startMonth; m <= endMonth; m++) {
		seasonLength += jalaliMonthLength(jy, m)!;
	}

	return seasonLength - daysPassed;
}

export function dateToDaysPassedJMonth(date: Date) {
	const { jd } = dateToJalali(date);
	return jd;
}

export function dateToDaysRemainingJMonth(date: Date) {
	const { jy, jm, jd } = dateToJalali(date);
	return jalaliMonthLength(jy, jm)! - jd;
}
