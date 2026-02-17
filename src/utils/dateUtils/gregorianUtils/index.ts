import { now } from "@internationalized/date";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type { TGregorian, TLocal, TWeekStart } from "src/types";

const TEHRAN_TZ = "Asia/Tehran";

export function todayTehran(): Date {
	const zdt = now(TEHRAN_TZ);
	return new Date(Date.UTC(zdt.year, zdt.month - 1, zdt.day, 12, 0, 0));
}

export function gregorianToDate(gy: number, gm: number, gd: number): Date | null {
	const utcDate = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));

	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TEHRAN_TZ,
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(utcDate);

	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);

	if (get("year") !== gy || get("month") !== gm || get("day") !== gd) return null;

	return utcDate;
}

export function dateToGregorian(date: Date): TGregorian {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TEHRAN_TZ,
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(date);

	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);

	return {
		gy: get("year"),
		gm: get("month"),
		gd: get("day"),
	};
}

export function dateToWeekdayName(date: Date, local: TLocal = "fa"): string {
	const locale = local === "fa" ? "fa-IR" : "en-US";

	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: TEHRAN_TZ,
	}).format(date);
}

export function getWeekdayTehran(date: Date): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TEHRAN_TZ,
		weekday: "short",
	}).formatToParts(date);

	const day = parts.find((p) => p.type === "weekday")!.value;
	return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

export const weekStartNumber = (weekStart: TWeekStart): number =>
	({
		sat: 6,
		sun: 0,
		mon: 1,
	})[weekStart];

export function getJalaliMonthName(month: number, local: TLocal = "fa") {
	return JALALI_MONTHS_NAME[local][month];
}

export function getSeasonName(season: number, local: TLocal = "fa") {
	return SEASONS_NAME[local][season];
}

export function addDayDate(date: Date, days: number): Date {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() + days);
	return result;
}

export function jalaliToSeason(jm: number): number {
	return Math.ceil(jm / 3);
}
