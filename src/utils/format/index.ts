export function dayFormat(
	year: number,
	month: number,
	day: number,
	option?: { separator?: string },
): string {
	const separator = option?.separator ?? "-";

	return `${year}${separator}${String(month).padStart(2, "0")}${separator}${String(day).padStart(
		2,
		"0",
	)}`;
}

export function weekFormat(year: number, week: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}W${week.toString().padStart(2, "0")}`;
}

export function monthFormat(year: number, month: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}${month.toString().padStart(2, "0")}`;
}

export function seasonFormat(year: number, season: number, option?: { separator?: string }) {
	const separator = option?.separator ?? "-";

	return `${year}${separator}${season.toString().padStart(2, "0")}`;
}

export function yearFormat(year: number) {
	return `${year}`;
}
