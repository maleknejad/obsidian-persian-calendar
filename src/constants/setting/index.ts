import type { TPluginSetting } from "src/types";

export const DEFAULT_SETTING: TPluginSetting = {
	dailyNotesFolderPath: "/",
	weeklyNotesFolderPath: "/",
	monthlyNotesFolderPath: "/",
	yearlyNotesFolderPath: "/",
	enableQuarterlyNotes: true,
	quarterlyNotesFolderPath: "/",
	dateFormat: "jalali",
	version: `4.0.0`,
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
