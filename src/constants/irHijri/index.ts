const iranianHijriAdjustments: { [key: number]: { [key: number]: number } } = {
	1445: { 1: 30, 2: 29, 3: 30, 4: 29, 5: 30, 6: 29, 7: 30, 8: 29, 9: 30, 10: 29, 11: 30, 12: 29 },
	1446: { 1: 30, 2: 30, 3: 30, 4: 29, 5: 30, 6: 30, 7: 29, 8: 30, 9: 29, 10: 30, 11: 29, 12: 29 },
	1447: { 1: 30, 2: 29, 3: 30, 4: 30, 5: 30, 6: 29, 7: 30, 8: 29, 9: 30, 10: 29, 11: 30, 12: 29 },
	// Add more years and month lengths as needed
};

const basePersianDate = { jy: 1402, jm: 4, jd: 28 };
const baseHijriDate = { hy: 1445, hm: 1, hd: 1 };

// طول ماه هجری قمری ایران توسط ستاد استهلال به صورت ماهانه گزارش میشه
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
