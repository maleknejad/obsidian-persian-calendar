export type TBaseDate = "jalali" | "gregorian";

export type TPluginSetting = {
	dailyNotesFolderPath: string;
	weeklyNotesFolderPath: string;
	monthlyNotesFolderPath: string;
	yearlyNotesFolderPath: string;
	enableQuarterlyNotes: boolean;
	quarterlyNotesFolderPath: string;
	dateFormat: TBaseDate;
	version: string;
	announceUpdates: boolean;
	showGeorgianDates: boolean;
	hijriDateAdjustment: number;
	showHijriDates: boolean;
	weekendDays: string;
	showHolidays: boolean;
	showOfficialIranianCalendar: boolean;
	showAncientIranianCalendar: boolean;
	showShiaCalendar: boolean;
	hijriCalendarType: string;
};

export type TLocal = "fa" | "en";

export type THolidayEvent = {
	holiday: boolean;
	month: number;
	day: number;
	type: string;
	title: string;
};

export type TBuildContext = {
	currentDate: Date;
	fileDate: Date;
	fileName: string;
	baseDate: TBaseDate;
	isWeekly: boolean;
	isMonthly: boolean;
};
