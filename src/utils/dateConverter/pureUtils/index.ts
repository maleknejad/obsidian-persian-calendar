import type { TGregorian, TNumberOfMonths, TLocal, TWeekStart, TJalali } from "src/types";
import { JALALI_MONTHS } from "src/constants";

export const weekStartNumber = (weekStart: TWeekStart): number =>
	({
		sat: 6,
		sun: 0,
		mon: 1,
	}[weekStart]);

export function getJalaliMonthName(month: TNumberOfMonths, local: "fa" | "en" = "fa"): string {
	return JALALI_MONTHS[local][month];
}

export function dateToGregorian(date: Date): TGregorian {
	return {
		gy: date.getFullYear(),
		gm: date.getMonth() + 1,
		gd: date.getDate(),
	};
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
