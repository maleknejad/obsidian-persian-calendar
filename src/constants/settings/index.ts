import type { TSetting } from "src/types";

export const DEFAULT_SETTING: TSetting = {
	versionUpdate: true,
	dateFormat: "gregorian",
	askForCreateNote: true,
	showSeasonalNotes: true,
	showHolidays: true,
	weekendDays: "friday",
	showGeorgianDates: true,
	showHijriDates: true,
	dailyNotesPath: "/",
	weeklyNotesPath: "/",
	monthlyNotesPath: "/",
	seasonalNotesPath: "/",
	yearlyNotesPath: "/",
	showIRGovernmentEvents: true,
	showIRAncientEvents: true,
	showIRIslamEvents: true,
	showGlobalEvents: true,
};
