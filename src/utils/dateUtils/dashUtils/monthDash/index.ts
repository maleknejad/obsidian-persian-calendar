import {
	extractMonthFormat,
	isDayFormat,
	isMonthFormat,
	toMonthFormat,
} from "src/utils/formatters";
import {
	dashToDate,
	dateToDash,
	dateToEndDayOfJMonthDate,
	dateToJalali,
	dateToMonthName,
	dateToStartDayOfJMonthDate,
	jalaliMonthLength,
	jalaliToDate,
} from "../..";
import type { TDateFormat } from "src/types";

export function dateToJMonthDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);

	return toMonthFormat(jy, jm, { separator });
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
