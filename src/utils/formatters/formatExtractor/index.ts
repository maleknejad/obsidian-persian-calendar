import { isMonthlyRegex, isSeasonalRegex, isWeeklyRegex } from "src/constants";

export function extractWeekFormat(title: string) {
	const match = title.match(isWeeklyRegex);
	if (!match) return null;

	const year = Number(match[1]);
	const week = Number(match[2]);

	return { year, week };
}

export function extractMonthFormat(title: string) {
	const match = title.match(isMonthlyRegex);

	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);

	return { year, month };
}

export function extractSeasonFormat(title: string) {
	const match = title.match(isSeasonalRegex);
	if (!match) return null;

	console.log(match);

	const year = Number(match[1]);
	const season = Number(match[2]);

	return { year, season };
}
