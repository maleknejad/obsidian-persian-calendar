// طول ماه هجری قمری ایران توسط ستاد استهلال به صورت ماهانه گزارش میشه => https://b2n.ir/estehlal
export const IRHIJRI_MONTHS_BY_YEAR = {
	// (hijri)year: [دی‌الحجه، ذی‌القعده، شوال، رمضان، شعبان، رجب، جمادی‌الثانی، جمادی‌الاول، ربیع‌الثانی، ربیع‌الاول، صفر، محرم]
	1440: [29, 29, 30, 30, 30, 29, 30, 29, 30, 29, 30, 29],
	1441: [29, 30, 29, 30, 30, 29, 30, 30, 29, 30, 29, 30],
	1442: [29, 29, 30, 29, 30, 29, 30, 30, 29, 30, 30, 29],
	1443: [29, 30, 30, 29, 29, 30, 29, 30, 29, 30, 30, 29],
	1444: [30, 30, 29, 30, 29, 29, 30, 29, 30, 29, 30, 29],
	1445: [30, 30, 30, 29, 29, 30, 29, 30, 29, 30, 29, 29],
	1446: [30, 30, 30, 29, 30, 30, 30, 30, 29, 29, 29, 30],
	1447: [29, 30, 30, 29, 30, 30, 29, 30, 30, 30, 29, 30],
} as const;

//todo: move in the end
export type SupportedHijriYearType = keyof typeof IRHIJRI_MONTHS_BY_YEAR;

//todo: move in the end
function hijriMonthsLength(year: number): readonly number[] | null {
	return IRHIJRI_MONTHS_BY_YEAR[year as SupportedHijriYearType] ?? null;
}
