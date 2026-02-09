import type { HIJRI_MONTHS_LENGTH } from "src/constants";

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

export type TEventBase = "IR Government" | "IR Islam" | "IR Ancient" | "Global";

export type TEventObject = {
	holiday: boolean;
	month: number;
	day: number;
	base: TEventBase;
	title: string;
};

export type TEventObjectWithoutDate = Omit<TEventObject, "month" | "day">;

export type TDayMap = Map<number, TEventObject[]>;
export type TMonthMap = Map<number, TDayMap>;

export type TGetDayOfWeek = { jYear: number; jWeekNumber: number };

export type TSupportedHijriYear = keyof typeof HIJRI_MONTHS_LENGTH;

export type TDateFormat = "jalali" | "gregorian" | "hijri";

export type TShowEvents = {
	showIRGovernmentEvents?: boolean;
	showIRAncientEvents?: boolean;
	showIRIslamEvents?: boolean;
	showGlobalEvents?: boolean;
};

export type THijriAnchor = {
	first: {
		gregorian: { gy: number; gm: number; gd: number };
		hijri: { hy: number; hm: number; hd: number };
	};
	last: {
		gregorian: { gy: number; gm: number; gd: number };
		hijri: { hy: number; hm: number; hd: number };
	};
};

export type TBoolSettingKeys = Extract<
	keyof TSetting,
	| "showSeasonalNotes"
	| "showGeorgianDates"
	| "showHijriDates"
	| "showHolidays"
	| "showIRGovernmentEvents"
	| "showIRAncientEvents"
	| "showIRIslamEvents"
	| "showGlobalEvents"
	| "askForCreateNote"
>;

export type TSetting = {
	lastSeenVersion?: string;
	versionUpdate: boolean;
	askForCreateNote: boolean;
	dateFormat: TDateFormat;
	showSeasonalNotes: boolean;
	// show holidays
	showHolidays: boolean;
	weekendDays: string;
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
	fileDate: Date | null;
	fileName: string;
	baseDate: TDateFormat;
	isMonthly: boolean;
	isSeasonal: boolean;
	targetYear: number | null;
};

export type TMonthGridCell = TJalali & {
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

export type TReleaseNote = {
	version: string;
	changes: string[];
};

export type TSocialLink = {
	href: string;
	title: string;
	icon: string;
};

export type TPathTokenContext = {
	jy?: number;
	jm?: number;
	season?: number;
	local?: TLocal;
};
