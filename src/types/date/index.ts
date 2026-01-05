// jalali = هجری شمسی/خورشیدی
export type JalaliType = {
	jy: number;
	jm: number;
	jd: number;
};

// gregorian = میلادی
export type GregorianType = {
	gy: number;
	gm: number;
	gd: number;
};

// hijri = هجری قمری
export type HijriType = {
	hy: number;
	hm: number;
	hd: number;
};

export type WeekStartType = "sat" | "sun" | "mon";

export type NumberOfMonthsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type getWeekStartDatePraps = { jYear: number; jWeekNumber: number };

export type HolidayEvent = {
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
