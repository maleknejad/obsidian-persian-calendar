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
}


const DEFAULT_SETTINGS: PluginSettings = {
    dailyNotesFolderPath: '/',
    weeklyNotesFolderPath: '/',
    monthlyNotesFolderPath: '/',
    yearlyNotesFolderPath: '/',
    enableQuarterlyNotes: true,
    quarterlyNotesFolderPath: '/',
    dateFormat: 'persian',
    version: `0.0.0`,
    timeoutDuration: 1250,
    announceUpdates: true,
    showGeorgianDates: true,
    hijriDateAdjustment: -1,
};

type JalaaliDate = {
    jy: number;
    jm: number;
    jd: number;
};
export type {JalaaliDate}
export { DEFAULT_SETTINGS };
export type { PluginSettings };
