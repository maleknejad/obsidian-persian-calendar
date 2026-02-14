// TODO: divide and conquer

import {
	dateToJalali,
	gregorianToJalali,
	jalaliToGregorian,
	checkValidJalali,
	gregorianToDate,
	jalaliMonthLength,
	dateToJWeekNumber,
	jalaliToStartDayOfWeek,
	jalaliToSeason,
	dateToGregorian,
	jalaliToEndDayOfWeek,
	jalaliToDate,
	dateToMonthName,
	dateToEndDayOfJMonthDate,
	dateToStartDayOfJMonthDate,
	dateToSeasonName,
	getSeasonName,
	dateToStartDayOfSeasonDate,
	dateToEndDayOfSeasonDate,
	checkKabiseh,
	dateToHijri,
} from "..";
import {
	extractMonthFormat,
	extractWeekFormat,
	toDayFormat,
	toMonthFormat,
	toSeasonFormat,
	toWeekFormat,
	extractDayFormat,
	isDayFormat,
	isWeekFormat,
	isMonthFormat,
	isSeasonFormat,
	extractSeasonFormat,
	isYearFormat,
	extractYearFormat,
} from "src/utils/formatters";
import type { TDateFormat, TJalali, TWeekStart } from "src/types";

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

export function dateToJYearDash(date: Date) {
	const { jy } = dateToJalali(date);
	return String(jy);
}

export function dateToSeasonDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	return toSeasonFormat(jy, season, { separator });
}

export function dateToJMonthDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);

	return toMonthFormat(jy, jm, { separator });
}

export function dashToStartDayOfWeekDash(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return;

		const { jy: jYear } = dateToJalali(date);
		const jWeekNumber = dateToJWeekNumber(date);

		const { jy, jm, jd, gy, gm, gd } = jalaliToStartDayOfWeek({ jYear, jWeekNumber });

		if (dateFormat === "jalali") {
			return toDayFormat(jy, jm, jd, { separator });
		}

		return toDayFormat(gy, gm, gd, { separator });
	}

	if (isWeekFormat(dashDate)) {
		const weekProps = extractWeekFormat(dashDate);
		if (!weekProps) return;

		const { jy, jm, jd } = jalaliToStartDayOfWeek({
			jYear: weekProps.year,
			jWeekNumber: weekProps.week,
		});
		const date = jalaliToDate(jy, jm, jd);

		return dateToDash(date, dateFormat);
	}

	return null;
}

export function dashToEndDayOfWeekDash(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return;

		const { jy: jYear } = dateToJalali(date);
		const jWeekNumber = dateToJWeekNumber(date);

		const { jy, jm, jd, gy, gm, gd } = jalaliToEndDayOfWeek({ jYear, jWeekNumber });

		if (dateFormat === "jalali") {
			return toDayFormat(jy, jm, jd, { separator });
		}

		return toDayFormat(gy, gm, gd, { separator });
	}

	if (isWeekFormat(dashDate)) {
		const weekProps = extractWeekFormat(dashDate);
		if (!weekProps) return;

		const { jy, jm, jd } = jalaliToEndDayOfWeek({
			jYear: weekProps.year,
			jWeekNumber: weekProps.week,
		});
		const date = jalaliToDate(jy, jm, jd);

		return dateToDash(date, dateFormat);
	}

	return null;
}

export function dashToDate(dashDate: string, dateFormat: TDateFormat): Date | null {
	if (!isDayFormat(dashDate)) return null;

	if (dateFormat === "jalali") {
		return jalaliDashToDate(dashDate);
	}

	return gregorianDashToDate(dashDate);
}

export function dateToJWeekDash(
	date: Date,
	weekStart: TWeekStart = "sat",
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	const { jy } = dateToJalali(date);
	const jWeekNumber = dateToJWeekNumber(date, weekStart);

	return toWeekFormat(jy, jWeekNumber, { separator });
}

export function dashToJWeekDash(dashDate: string, dateFormat?: TDateFormat): string | null {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToJWeekDash(date);
	}

	if (isWeekFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToJMonthDash(dashDate: string, dateFormat?: TDateFormat) {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy, jm } = dateToJalali(date);

		return toMonthFormat(jy, jm);
	}

	if (isMonthFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToJMonthName(dashDate: string, dateFormat?: TDateFormat) {
	if (isDayFormat(dashDate) && dateFormat) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToMonthName(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date = jalaliToDate(monthProps.year, monthProps.month, 1);
		return dateToMonthName(date);
	}

	return null;
}

export function dashToStartDayOfJMonthDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const currentDate = dashToDate(dashDate, dateFormat);
		if (!currentDate) return null;

		const startDate = dateToStartDayOfJMonthDate(currentDate);
		return dateToDash(startDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const startDate = jalaliToDate(monthProps.year, monthProps.month, 1);
		return dateToDash(startDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfJMonthDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const currentDate = dashToDate(dashDate, dateFormat);
		if (!currentDate) return null;

		const endDate = dateToEndDayOfJMonthDate(currentDate);
		return dateToDash(endDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const day = jalaliMonthLength(monthProps.year, monthProps.month);

		const endDate = jalaliToDate(monthProps.year, monthProps.month, day);
		return dateToDash(endDate, dateFormat);
	}

	return null;
}

export function dashToSeasonName(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToSeasonName(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const season = jalaliToSeason(monthProps.month);
		return getSeasonName(season);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		return getSeasonName(seasonProps.season);
	}

	return null;
}

export function dashToSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToSeasonDash(date);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const season = jalaliToSeason(monthProps.month);

		return toSeasonFormat(monthProps.year, season);
	}

	if (isSeasonFormat(dashDate)) {
		return dashDate;
	}

	return null;
}

export function dashToStartDayOfSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const startDayOfSeasonDate = dateToStartDayOfSeasonDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date = jalaliToDate(monthProps.year, monthProps.month, 1);

		const startDayOfSeasonDate = dateToStartDayOfSeasonDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		const firstMonthOfSeason = 3 * (seasonProps.season - 1) + 1;
		const date = jalaliToDate(seasonProps.year, firstMonthOfSeason, 1);

		const startDayOfSeasonDate = dateToStartDayOfSeasonDate(date);
		return dateToDash(startDayOfSeasonDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfSeasonDash(dashDate: string, dateFormat: TDateFormat) {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const endDayOfSeasonDate = dateToEndDayOfSeasonDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	if (isMonthFormat(dashDate)) {
		const monthProps = extractMonthFormat(dashDate);
		if (!monthProps) return null;

		const date = jalaliToDate(monthProps.year, monthProps.month, 1);

		const endDayOfSeasonDate = dateToEndDayOfSeasonDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	if (isSeasonFormat(dashDate)) {
		const seasonProps = extractSeasonFormat(dashDate);
		if (!seasonProps) return null;

		const lastMonthOfSeason = 3 * seasonProps.season;
		const date = jalaliToDate(seasonProps.year, lastMonthOfSeason, 1);

		const endDayOfSeasonDate = dateToEndDayOfSeasonDate(date);
		return dateToDash(endDayOfSeasonDate, dateFormat);
	}

	return null;
}

export function dashToStartDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);
		const startDate = jalaliToDate(jy, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		const startDate = jalaliToDate(year, 1, 1);

		return dateToDash(startDate, dateFormat);
	}

	return null;
}

export function dashToEndDayOfYearDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDayFormat(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		const { jy } = dateToJalali(date);

		const endDay = checkKabiseh(jy) ? 30 : 29;
		const endDate = jalaliToDate(jy, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	if (isYearFormat(dashDate)) {
		const year = extractYearFormat(dashDate);
		if (!year) return null;

		const endDay = checkKabiseh(year) ? 30 : 29;
		const endDate = jalaliToDate(year, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}

	return null;
}
