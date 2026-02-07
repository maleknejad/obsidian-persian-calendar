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
	dailyNotesPath: "Journal/jYYYY/روزنوشت",
	weeklyNotesPath: "Journal/jYYYY/هفته‌نوشت",
	monthlyNotesPath: "Journal/jYYYY/ماه‌نوشت",
	seasonalNotesPath: "Journal/jYYYY/فصل‌نوشت",
	yearlyNotesPath: "Journal/jYYYY",
	showIRGovernmentEvents: true,
	showIRAncientEvents: true,
	showIRIslamEvents: true,
	showGlobalEvents: true,
};
