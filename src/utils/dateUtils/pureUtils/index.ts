import { JALALI_MONTHS_NAME } from "src/constants";
import type { TGregorian, TLocal, TWeekStart } from "src/types";

export function gregorianToDate(gy: number, gm: number, gd: number) {
	const utcDate = new Date(Date.UTC(gy, gm - 1, gd));

	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Tehran",
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
		timeZone: "Asia/Tehran",
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
		timeZone: "Asia/Tehran",
	}).format(date);
}

export const weekStartNumber = (weekStart: TWeekStart): number =>
	({
		sat: 6,
		sun: 0,
		mon: 1,
	})[weekStart];

export function getJalaliMonthName(month: number, local: TLocal = "fa"): string {
	return JALALI_MONTHS_NAME[local][month];
}

export function addDayDate(date: Date, days: number) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function jalaliToSeason(jm: number): number {
	return Math.ceil(jm / 3);
}
