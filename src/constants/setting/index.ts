import type { TPluginSetting } from "src/types";

export const DEFAULT_SETTING: TPluginSetting = {
	dailyNotesFolderPath: "/",
	weeklyNotesFolderPath: "/",
	monthlyNotesFolderPath: "/",
	yearlyNotesFolderPath: "/",
	enableQuarterlyNotes: true,
	quarterlyNotesFolderPath: "/",
	dateFormat: "persian",
	version: `4.0.0`,
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
