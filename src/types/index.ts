import type { IRAN_HIJRI_MONTHS_LENGTH } from "src/constants";

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
export type TNumberOfSeasons = 1 | 2 | 3 | 4;

export type TEventBase = "IR Government" | "IR Islam" | "IR Ancient" | "Global";

export type TEventObject = {
	holiday: boolean;
	month: TNumberOfMonths;
	day: number;
	base: TEventBase;
	title: string;
};

export type TEventObjectWithoutDate = Omit<TEventObject, "month" | "day">;

export type DayMap = Map<number, TEventObject[]>;
export type MonthMap = Map<TNumberOfMonths, DayMap>;

export type TGetDayOfWeek = { jYear: number; jWeekNumber: number };

export type SupportedHijriYearType = keyof typeof IRAN_HIJRI_MONTHS_LENGTH;

export type TDateFormat = "jalali" | "gregorian" | "hijri";

export type TShowEvents = {
	showIRGovernmentEvents?: boolean;
	showIRAncientEvents?: boolean;
	showIRIslamEvents?: boolean;
	showGlobalEvents?: boolean;
};

export type TPluginSetting = {
	dateFormat: TDateFormat;
	version: string;
	showSeasonalNotes: boolean;
	announceUpdates: boolean;
	weekendDays: string;
	showHolidays: boolean;
	// show dates
	showGeorgianDates: boolean;
	showHijriDates: boolean;
	// notes folder path
	dailyNotesPath: string;
	weeklyNotesPath: string;
	monthlyNotesPath: string;
	seasonalNotesPath: string;
	yearlyNotesPath: string;
	// show events
	showIRGovernmentEvents: boolean;
	showIRAncientEvents: boolean;
	showIRIslamEvents: boolean;
	showGlobalEvents: boolean;
};

export type TLocal = "fa" | "en";

export type TBuildContext = {
	currentDate: Date;
	fileDate: Date;
	fileName: string;
	baseDate: TDateFormat;
	isWeekly: boolean;
	isMonthly: boolean;
};

export type MonthGridCell = TJalali & {
	date: Date;
	gregorian: TGregorian;
	hijri: THijri;
	index: number;
	row: number;
	column: number;
	isInCurrentMonth: boolean;
	isToday: boolean;
	isWeekend: boolean;
	isHoliday: boolean;
};
