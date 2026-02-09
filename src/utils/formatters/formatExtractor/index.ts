import { isMonthlyRegex, isSeasonalRegex, isWeeklyRegex } from "src/constants";
import { isDailyRegex, isYearlyRegex } from "src/constants/regex";

export function extractDayFormat(format: string) {
	const match = format.match(isDailyRegex);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	return { year, month, day };
}

export function extractWeekFormat(format: string) {
	const match = format.match(isWeeklyRegex);
	if (!match) return null;

	const year = Number(match[1]);
	const week = Number(match[2]);

	return { year, week };
}

export function extractMonthFormat(format: string) {
	const match = format.match(isMonthlyRegex);

	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);

	return { year, month };
}

export function extractSeasonFormat(format: string) {
	const match = format.match(isSeasonalRegex);
	if (!match) return null;

	const year = Number(match[1]);
	const season = Number(match[2]);

	return { year, season };
}

export function extractYearFormat(format: string) {
	const match = format.match(isYearlyRegex);
	if (!match) return null;

	const year = Number(match[1]);

	return year;
}

export function isDayFormat(format: string) {
	return isDailyRegex.test(format);
}

export function isWeekFormat(format: string) {
	return isWeeklyRegex.test(format);
}

export function isMonthFormat(format: string) {
	return isMonthlyRegex.test(format);
}

export function isSeasonFormat(format: string) {
	return isSeasonalRegex.test(format);
}

export function isYearFormat(format: string) {
	return isYearlyRegex.test(format);
}
