import {
	dateToJalali,
	gregorianToJalali,
	jalaliToGregorian,
	checkValidJalali,
	gregorianToDate,
	jalaliMonthLength,
	getDaysInJalaliYear,
	dateToJWeekNumber,
	jalaliToStartDayOfWeek,
	jalaliToSeason,
	dateToGregorian,
	jalaliToEndDayOfWeek,
	jalaliToDate,
} from "..";
import {
	extractMonthFormat,
	extractWeekFormat,
	toDayFormat,
	toMonthFormat,
	toSeasonFormat,
	toWeekFormat,
} from "src/utils/formatters";
import type { TDateFormat, TJalali, TWeekStart } from "src/types";
import { isDailyRegex, isWeeklyRegex } from "src/constants";

export function gregorianDashToJalaliDash(
	dashDate: string,
	option?: { separator?: string },
): string | null {
	const separator = option?.separator ?? "-";

	const match = dashDate.match(isDailyRegex);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

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

	const match = dashDate.match(isDailyRegex);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	try {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		return toDayFormat(gy, gm, gd, { separator });
	} catch {
		return null;
	}
}

export function jalaliDashToJalali(dashDate: string): TJalali | null {
	const match = dashDate.match(isDailyRegex);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	if (!checkValidJalali(jy, jm, jd)) return null;

	return { jy, jm, jd };
}

export function gregorianDashToJalali(dashDate: string): TJalali | null {
	const match = dashDate.match(isDailyRegex);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	if (!gregorianToDate(gy, gm, gd)) return null;

	return gregorianToJalali(gy, gm, gd);
}

export function gregorianDashToDate(dashDate: string): Date | null {
	const match = dashDate.match(isDailyRegex);
	if (!match) return null;

	const gy = +match[1];
	const gm = +match[2];
	const gd = +match[3];

	const date = gregorianToDate(gy, gm, gd);

	if (!date) return null;

	return date;
}

export function jalaliDashToDate(dashDate: string): Date | null {
	if (!isDailyRegex.test(dashDate)) return null;

	const jalali = jalaliDashToJalali(dashDate);
	if (!jalali) return null;

	const { gy, gm, gd } = jalaliToGregorian(jalali.jy, jalali.jm, jalali.jd);

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

export function dateToDaysPassedJYear(date: Date): number {
	const { jy, jm, jd } = dateToJalali(date);

	let daysPassed = 0;

	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month)!;
	}

	return daysPassed + jd;
}

export function dateToDaysRemainingJYear(date: Date): number {
	const { jy, jm, jd } = dateToJalali(date);

	let daysPassed = 0;

	for (let month = 1; month < jm; month++) {
		daysPassed += jalaliMonthLength(jy, month)!;
	}

	daysPassed += jd;

	return getDaysInJalaliYear(jy) - daysPassed;
}

export function dashToStartDayOfWeekDash(
	dashDate: string,
	dateFormat: TDateFormat,
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	if (isDailyRegex.test(dashDate)) {
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

	if (isWeeklyRegex.test(dashDate)) {
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

	if (isDailyRegex.test(dashDate)) {
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

	if (isWeeklyRegex.test(dashDate)) {
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

export function monthDashToMonthName(monthDash: string) {
	const monthProps = extractMonthFormat(monthDash);
	if (!monthProps) return null;

	return;
}

export function dashToDate(dashDate: string, dateFormat: TDateFormat): Date | null {
	if (!isDailyRegex.test(dashDate)) return null;

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

export function dashToJWeekDash(dashDate: string, dateFormat: TDateFormat): string | null {
	if (isDailyRegex.test(dashDate)) {
		const date = dashToDate(dashDate, dateFormat);
		if (!date) return null;

		return dateToJWeekDash(date);
	}

	if (isWeeklyRegex.test(dashDate)) {
		return dashDate;
	}

	return null;
}
