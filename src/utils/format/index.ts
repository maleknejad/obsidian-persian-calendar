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

export function toFaNumber(number: number): string {
	const strNumber = String(number);

	const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
	return strNumber.replace(/\d/g, (d) => FA_DIGITS[parseInt(d, 10)]);
}

export function toArNumber(number: number): string {
	const strNumber = String(number);

	const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
	return strNumber.replace(/\d/g, (d) => AR_DIGITS[parseInt(d, 10)]);
}
