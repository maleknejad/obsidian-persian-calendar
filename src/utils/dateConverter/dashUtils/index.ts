import {
	dateToJalali,
	gregorianToJalali,
	jalaliToGregorian,
	isValidJalali,
	gregorianToDate,
	jalaliMonthLength,
	getDaysInJalaliYear,
	dateToJWeekNumber,
	jalaliToStartDayOfWeek,
	jalaliToEndDayOfWeek,
} from "..";
import { dayFormat, monthFormat, quarterFormat, weekFormat, yearFormat } from "src/utils/format";
import type { TBaseDate, TGregorian, TJalali, TWeekStart } from "src/types";

export function gregorianDashToJalaliDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const match = dashDate.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	const date = gregorianToDate(gy, gm, gd);

	if (!date) return null;

	const { jy, jm, jd } = dateToJalali(date);

	return dayFormat(jy, jm, jd, { separator });
}

export function jalaliDashToGregorianDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const match = dashDate.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	try {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		return dayFormat(gy, gm, gd, { separator });
	} catch {
		return null;
	}
}

export function jalaliDashToJalali(dashDate: string): TJalali | null {
	const match = dashDate.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	if (!isValidJalali(jy, jm, jd)) return null;

	return { jy, jm, jd };
}

export function gregorianDashToJalali(dashDate: string): TJalali | null {
	const match = dashDate.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	if (!gregorianToDate(gy, gm, gd)) return null;

	return gregorianToJalali(gy, gm, gd);
}

export function gregorianDashToDate(dashDate: string): Date | null {
	const match = dashDate.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	const date = gregorianToDate(gy, gm, gd);

	if (!date) return null;

	return date;
}

export function jalaliDashToDate(dashDate: string): Date | null {
	const jalali = jalaliDashToJalali(dashDate);
	if (!jalali) return null;

	const { gy, gm, gd } = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd);

	return new Date(gy, gm - 1, gd);
}

export function dashToDate(dashDate: string, baseDate: string): Date | null {
	if (baseDate === "jalali") {
		return jalaliDashToDate(dashDate);
	}

	return gregorianDashToDate(dashDate);
}

export function dateToJYearDash(date: Date) {
	const { jy } = dateToJalali(date);
	return yearFormat(jy);
}

export function dateToJQuarterDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jm } = dateToJalali(date);
	const jQuarter = Math.ceil(jm / 3);

	return quarterFormat(jm, jQuarter, { separator });
}

export function dateToJMonthDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);

	return monthFormat(jy, jm, { separator });
}

export function dateToJWeekDash(
	date: Date,
	weekStart: TWeekStart = "sat",
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	const { jy } = dateToJalali(date);
	const jWeekNumber = dateToJWeekNumber(date, weekStart);

	return weekFormat(jy, jWeekNumber, { separator });
}

export function dateToJDayDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm, jd } = dateToJalali(date);
	return dayFormat(jy, jm, jd, { separator });
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
	const { jy, jm, jd } = dateToJalali(date);

	let daysPassed = 0;

	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month);
	}

	daysPassed += jd;

	return getDaysInJalaliYear(jy) - daysPassed;
}

export function dateToStartDayOfWeekDash(
	date: Date,
	option?: { separator?: string; baseDate?: TBaseDate },
) {
	const baseDate = option?.baseDate ?? "jalali";
	const separator = option?.separator ?? "-";

	const { jy: jYear } = dateToJalali(date);
	const jWeekNumber = dateToJWeekNumber(date);

	if (baseDate === "jalali") {
		const { jy, jm, jd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber }, "jalali") as TJalali;
		return dayFormat(jy, jm, jd, { separator });
	}

	const { gy, gm, gd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber }, "gregorian") as TGregorian;
	return dayFormat(gy, gm, gd);
}

export function dateToEndDayOfWeekDash(
	date: Date,
	option?: { separator?: string; baseDate?: TBaseDate },
) {
	const baseDate = option?.baseDate ?? "jalali";
	const separator = option?.separator ?? "-";

	const { jy: jYear } = dateToJalali(date);
	const jWeekNumber = dateToJWeekNumber(date);

	if (baseDate === "jalali") {
		const { jy, jm, jd } = jalaliToEndDayOfWeek({ jYear, jWeekNumber }, "jalali") as TJalali;
		return dayFormat(jy, jm, jd);
	}

	const { gy, gm, gd } = jalaliToEndDayOfWeek({ jYear, jWeekNumber }, "gregorian") as TGregorian;
	return dayFormat(gy, gm, gd, { separator });
}
