// jalali = shamsi = khorshidi
export type JalaliType = {
	jy: number;
	jm: number;
	jd: number;
};

// gregorian = miladi
export type GregorianType = {
	gy: number;
	gm: number;
	gd: number;
};

export type WeekStartType = "sat" | "sun" | "mon";

export type NumberOfMonthsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type getWeekStartDatePraps = { jYear: number; jWeekNumber: number };
