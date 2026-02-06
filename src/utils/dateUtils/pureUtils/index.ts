import { JALALI_MONTHS_NAME } from "src/constants";
import type { TGregorian, TLocal, TWeekStart } from "src/types";

export function gregorianToDate(gy: number, gm: number, gd: number) {
	const date = new Date(gy, gm - 1, gd);

	if (date.getFullYear() !== gy || date.getMonth() !== gm - 1 || date.getDate() !== gd) {
		return null;
	}

	return date;
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

export function dateToGregorian(date: Date): TGregorian {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1;
	const day = date.getUTCDate();

	return { gy: year, gm: month, gd: day };
}

export function dateToWeekdayName(date: Date, local: TLocal = "fa"): string {
	const locale = local === "fa" ? "fa-IR" : "en-US";

	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: "Asia/Tehran",
	}).format(date);
}

export function addDayDate(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function jalaliToSeason(jm: number) {
	return Math.ceil(jm / 3);
}
