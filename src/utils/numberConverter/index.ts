const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const EN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function convertToFaNumber(str: string): string {
	return str.replace(/\d/g, (d) => FA_DIGITS[parseInt(d, 10)]);
}

export function convertToEnNumber(str: string): string {
	const faToEnMap: Record<string, string> = FA_DIGITS.reduce(
		(acc, num, idx) => ({ ...acc, [num]: EN_DIGITS[idx] }),
		{},
	);

	return str.replace(/[۰-۹]/g, (d) => faToEnMap[d]);
}
