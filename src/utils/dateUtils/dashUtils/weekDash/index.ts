import type { TDateFormat, TWeekStart } from "src/types";
import {
	dashToDate,
	dateToJalali,
	dateToJWeekNumber,
	jalaliToDate,
	jalaliToStartDayOfWeek,
	dateToDash,
	jalaliToEndDayOfWeek,
} from "../..";
import {
	extractWeekFormat,
	isDayFormat,
	isWeekFormat,
	toDayFormat,
	toWeekFormat,
} from "src/utils/formatters";

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
