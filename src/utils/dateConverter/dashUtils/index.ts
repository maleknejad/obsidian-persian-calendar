import { dayFormat, monthFormat, quarterFormat, weekFormat, yearFormat } from "src/utils/format";
import { dateToJalali, jalaliToJWeekNumber, gregorianToJalali, jalaliToGregorian } from "..";
import type { TJalali, TWeekStart } from "src/types";

// Date => (jalali)dayFormat
export function dateToJalaliDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm, jd } = dateToJalali(date);
	return dayFormat(jy, jm, jd, { separator });
}

// ("gy-gm-gd"|"gygmgd") => (jalali)dayFormat
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

	const date = new Date(gy, gm - 1, gd);
	if (date.getFullYear() !== gy || date.getMonth() !== gm - 1 || date.getDate() !== gd) {
		return null;
	}

	const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
	return dayFormat(jy, jm, jd, { separator });
}

// ("jy-jm-jd"|"jyjmjd") => {jy,jm,jd}
export function jalaliDashTojalali(dateStr: string): TJalali | null {
	const match = dateStr.match(/^(\d{4})-?(\d{1,2})-?(\d{1,2})$/);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	if (jy < 1000 || jy > 2000 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
		return null;
	}

	return { jy, jm, jd };
}

// ("jy-jm-jd"|"jyjmjd") => (gregorian)dayFormat
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

// ("gy-gm-gd") => {jy, jm, jd}
export function gregorianDashToJalali(dashDate: string): TJalali | null {
	const match = dashDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	// Validate actual Gregorian date
	const date = new Date(gy, gm - 1, gd);

	if (date.getFullYear() !== gy || date.getMonth() !== gm - 1 || date.getDate() !== gd) {
		return null;
	}

	return gregorianToJalali(gy, gm, gd);
}

// (Date) => (jalali)weekFormat
export function dateToJWeekDash(
	date: Date,
	weekStart: TWeekStart = "sat",
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	const { jy, jm, jd } = dateToJalali(date);
	const jWeekNumber = jalaliToJWeekNumber(jy, jm, jd, weekStart);

	return weekFormat(jy, jWeekNumber, { separator });
}

// (Date) => (jalali)monthFormat
export function dateToJMonthDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);

	return monthFormat(jy, jm, { separator });
}

// (Date) => (jalali)quarterFormat
export function dateToJQuarterDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jm } = dateToJalali(date);
	const jQuarter = Math.ceil(jm / 3);

	return quarterFormat(jm, jQuarter, { separator });
}

// (Date) => (jalali)yearFormat
export function dateToJYearDash(date: Date) {
	const { jy } = dateToJalali(date);
	return yearFormat(jy);
}
