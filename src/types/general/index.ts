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
