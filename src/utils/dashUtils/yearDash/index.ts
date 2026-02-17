import { extractYearFormat, isDayFormat, isYearFormat } from "src/utils/formatters";
import { checkKabiseh, dateToJalali, jalaliToDate } from "src/utils/dateUtils";
import { dashToDate, dateToDash } from "src/utils/dashUtils";
import type { TDateFormat } from "src/types";

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

export function dateToJYearDash(date: Date) {
	const { jy } = dateToJalali(date);
	return String(jy);
}
