import type { TDateFormat, TJalali } from "src/types";
import { extractDayFormat, isDayFormat, toDayFormat } from "src/utils/formatters";
import {
	checkValidJalali,
	dateToGregorian,
	dateToHijri,
	dateToJalali,
	gregorianToDate,
	gregorianToJalali,
	jalaliToGregorian,
} from "src/utils/dateUtils";

export function dashToDate(dashDate: string, dateFormat: TDateFormat): Date | null {
	if (!isDayFormat(dashDate)) return null;

	if (dateFormat === "jalali") {
		return jalaliDashToDate(dashDate);
	}

	return gregorianDashToDate(dashDate);
}

export function dateToDash(
	date: Date,
	dateFormat: TDateFormat,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	if (dateFormat === "jalali") {
		const { jy, jm, jd } = dateToJalali(date);
		return toDayFormat(jy, jm, jd, { separator });
	}

	if (dateFormat === "hijri") {
		const { hy, hm, hd } = dateToHijri(date);
		return toDayFormat(hy, hm, hd, { separator });
	}

	const { gy, gm, gd } = dateToGregorian(date);
	return toDayFormat(gy, gm, gd, { separator });
}

export function gregorianDashToJalaliDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	const date = gregorianToDate(gy, gm, gd);

	if (!date) return null;

	const { jy, jm, jd } = dateToJalali(date);

	return toDayFormat(jy, jm, jd, { separator });
}

export function jalaliDashToGregorianDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	try {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		return toDayFormat(gy, gm, gd, { separator });
	} catch {
		return null;
	}
}

export function jalaliDashToJalali(dashDate: string): TJalali | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	if (!checkValidJalali(jy, jm, jd)) return null;

	return { jy, jm, jd };
}

export function gregorianDashToJalali(dashDate: string): TJalali | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	if (!gregorianToDate(gy, gm, gd)) return null;

	return gregorianToJalali(gy, gm, gd);
}

export function gregorianDashToDate(dashDate: string): Date | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const gy = dayProps.year;
	const gm = dayProps.month;
	const gd = dayProps.day;

	const date = gregorianToDate(gy, gm, gd);

	if (!date) return null;

	return date;
}

export function jalaliDashToDate(dashDate: string): Date | null {
	const dayProps = extractDayFormat(dashDate);
	if (!dayProps) return null;

	const jy = dayProps.year;
	const jm = dayProps.month;
	const jd = dayProps.day;

	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);

	return new Date(gy, gm - 1, gd);
}
