const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toFaNumber(number: number): string {
	const strNumber = String(number);
	return strNumber.replace(/\d/g, (d) => FA_DIGITS[parseInt(d, 10)]);
}

export function toArNumber(number: number): string {
	const strNumber = String(number);
	return strNumber.replace(/\d/g, (d) => AR_DIGITS[parseInt(d, 10)]);
}
