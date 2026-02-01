import type { TSetting } from "src/types";

export const DEFAULT_SETTING: TSetting = {
	version: `4.0.0`,
	announceUpdates: true,
	dateFormat: "gregorian",
	showSeasonalNotes: true,
	// show holidays
	showHolidays: true,
	weekendDays: "friday",
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
