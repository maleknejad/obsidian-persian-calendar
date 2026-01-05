// jalali = هجری شمسی/خورشیدی
export type TJalali = {
	jy: number;
	jm: number;
	jd: number;
};

// gregorian = میلادی
export type TGregorian = {
	gy: number;
	gm: number;
	gd: number;
};

// hijri = هجری قمری
export type THijri = {
	hy: number;
	hm: number;
	hd: number;
};

export type TWeekStart = "sat" | "sun" | "mon";

export type TNumberOfMonths = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type TGetWeekStartDatePraps = { jYear: number; jWeekNumber: number };

export type THolidayEvent = {
	holiday: boolean;
	month: number;
	day: number;
	type: string;
	title: string;
};

//todo: remove in the end
export type HijriAdjustments = {
	[year: number]: {
		[month: number]: number;
	};
};
