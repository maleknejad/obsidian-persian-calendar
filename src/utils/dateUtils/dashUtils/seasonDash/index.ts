import { extractMonthFormat, extractSeasonFormat, isDayFormat, isMonthFormat, isSeasonFormat, toSeasonFormat } from "src/utils/formatters";
import { dashToDate, dateToDash, dateToEndDayOfSeasonDate, dateToJalali, dateToSeasonName, dateToStartDayOfSeasonDate, getSeasonName, jalaliToDate, jalaliToSeason } from "../..";
import type { TDateFormat } from "src/types";

export function dateToSeasonDash(date: Date, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	const { jy, jm } = dateToJalali(date);
	const season = jalaliToSeason(jm);

	return toSeasonFormat(jy, season, { separator });
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
