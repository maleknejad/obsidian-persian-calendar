interface PluginSettings {
	dailyNotesFolderPath: string;
	weeklyNotesFolderPath: string;
	monthlyNotesFolderPath: string;
	yearlyNotesFolderPath: string;
	enableQuarterlyNotes: boolean;
	quarterlyNotesFolderPath: string;
	dateFormat: string;
	version: string;
	announceUpdates: boolean;
	showGeorgianDates: boolean;
	timeoutDuration: number;
	hijriDateAdjustment: number;
	showHijriDates: boolean;
	weekendDays: string;
	showHolidays: boolean;
	showOfficialIranianCalendar: boolean;
	showAncientIranianCalendar: boolean;
	showShiaCalendar: boolean;
	hijriCalendarType: string;
}

export interface HolidayEvent {
	holiday: boolean;
	month: number;
	day: number;
	type: string;
	title: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	dailyNotesFolderPath: "/",
	weeklyNotesFolderPath: "/",
	monthlyNotesFolderPath: "/",
	yearlyNotesFolderPath: "/",
	enableQuarterlyNotes: true,
	quarterlyNotesFolderPath: "/",
	dateFormat: "persian",
	version: `0.0.0`,
	timeoutDuration: 1250,
	announceUpdates: true,
	showGeorgianDates: true,
	hijriDateAdjustment: -1,
	showHijriDates: true,
	weekendDays: "friday",
	showHolidays: true,
	showOfficialIranianCalendar: true,
	showAncientIranianCalendar: true,
	showShiaCalendar: true,
	hijriCalendarType: "iran",
};

export interface HijriAdjustments {
	[year: number]: {
		[month: number]: number;
	};
}

type JalaaliDate = {
	jy: number;
	jm: number;
	jd: number;
};
export type { JalaaliDate };
export { DEFAULT_SETTINGS };
export type { PluginSettings };
