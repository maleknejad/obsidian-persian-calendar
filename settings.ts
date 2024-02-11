
interface PluginSettings {
    dailyNotesFolderPath: string;
    weeklyNotesFolderPath: string;
    monthlyNotesFolderPath: string;
    yearlyNotesFolderPath: string;
}


const DEFAULT_SETTINGS: PluginSettings = {
    dailyNotesFolderPath: '/',
    weeklyNotesFolderPath: '/',
    monthlyNotesFolderPath: '/',
    yearlyNotesFolderPath: '/',
};

type JalaaliDate = {
    jy: number;
    jm: number;
    jd: number;
};
export type {JalaaliDate}
export { DEFAULT_SETTINGS };
export type { PluginSettings };
