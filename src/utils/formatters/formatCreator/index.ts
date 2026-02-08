export function toDayFormat(
	year: number,
	month: number,
	day: number,
	option?: { separator?: string },
) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}${String(month).padStart(2, "0")}${separator}${String(day).padStart(
		2,
		"0",
	)}`;
}

export function toWeekFormat(year: number, week: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}W${week.toString().padStart(2, "0")}`;
}

export function toMonthFormat(year: number, month: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}${month.toString().padStart(2, "0")}`;
}

export function toSeasonFormat(year: number, season: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}S${season.toString()}`;
}
