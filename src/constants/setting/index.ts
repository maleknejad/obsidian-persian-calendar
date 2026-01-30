import type { TPluginSetting } from "src/types";

export const DEFAULT_SETTING: TPluginSetting = {
	showSeasonalNotes: true,
	dateFormat: "jalali",
	version: `4.0.0`,
	announceUpdates: true,
	weekendDays: "friday",
	showHolidays: true,
	// show dates
	showGeorgianDates: true,
	showHijriDates: true,
	// notes folder path
	dailyNotesPath: "/",
	weeklyNotesPath: "/",
	monthlyNotesPath: "/",
	seasonalNotesPath: "/",
	yearlyNotesPath: "/",
	// show events
	showIRGovernmentEvents: true,
	showIRAncientEvents: true,
	showIRIslamEvents: true,
	showGlobalEvents: true,
};
