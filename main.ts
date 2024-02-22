import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import PersianCalendarView from './view';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';
import { toJalaali } from 'jalaali-js';
import moment from 'moment-jalaali';


export default class PersianCalendarPlugin extends Plugin {
    settings: PluginSettings = DEFAULT_SETTINGS;
    
    async onload() {
        await this.loadSettings();
        this.registerView('persian-calendar', (leaf) => new PersianCalendarView(leaf, this.app, this.settings));
        this.addRibbonIcon('calendar', 'روزنوشت امروز', async () => {
            const todayJalaali = toJalaali(new Date());
            const dayNumber = todayJalaali.jd;
            const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
            if (leaf) {
                const view = leaf.view;
                if (view instanceof PersianCalendarView) {
                    await view.openOrCreateDailyNote(dayNumber);
                }
            } else {
                console.error('Persian Calendar view is not open. Please open the Persian Calendar first.');
            }
        });
        
        this.addSettingTab(new PersianCalendarSettingTab(this.app, this));
        this.addCommand({
            id: 'open-todays-daily-note',
            name: 'Today - باز کردن روزنوشت امروز',
            callback: async () => {
                const today = new Date();
                const todayJalaali = toJalaali(today);
                const dayNumber = todayJalaali.jd;
                openNoteForDate(todayJalaali.jy, todayJalaali.jm, dayNumber);
            }
        });
        this.addCommand({
            id: 'open-tomorrow-daily-note',
            name: 'Tomorrow - باز کردن روزنوشت فردا',
            callback: async () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1); 
                const tomorrowJalaali = toJalaali(tomorrow);
                const dayNumber = tomorrowJalaali.jd;
                openNoteForDate(tomorrowJalaali.jy, tomorrowJalaali.jm, dayNumber);
            }
        });
        this.addCommand({
            id: 'open-yesterday-daily-note',
            name: 'Yesterday - باز کردن روزنوشت دیروز',
            callback: async () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1); 
                const yesterdayJalaali = toJalaali(yesterday);
                const dayNumber = yesterdayJalaali.jd;
                openNoteForDate(yesterdayJalaali.jy, yesterdayJalaali.jm, dayNumber);
            }
        });
        

        this.addCommand({
            id: 'open-this-weeks-note',
            name: 'Weekly - باز کردن هفته‌نوشت این هفته',
            callback: async () => {
                // Get the current Jalaali date
                const today = new Date();
                const todayJalaali = toJalaali(today); // Assuming toJalaali returns a JalaaliDate object

                // Calculate the current week number
                // This step requires a method to calculate the week number from a JalaaliDate
                const currentWeekNumber = this.calculateCurrentWeekNumber(todayJalaali);

                // Open or create the weekly note for the current week
                const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
                if (leaf) {
                    const view = leaf.view;
                    if (view instanceof PersianCalendarView) {
                        view.openOrCreateWeeklyNote(currentWeekNumber, todayJalaali.jy);
                    }
                } else {
                    console.error('Persian Calendar view is not open.');
                }
            },
        });

        this.addCommand({
            id: 'open-current-months-note',
            name: 'Monthly - باز کردن ماه‌نوشت این هفته',
            callback: async () => {
                const today = new Date();
                const todayJalaali = toJalaali(today);
                const jy = todayJalaali.jy;
                const month = todayJalaali.jm;
                const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
                if (leaf) {
                    const view = leaf.view;
                    if (view instanceof PersianCalendarView) {
                        await view.openOrCreateMonthlyNote(month, jy);
                    }
                } else {
                    console.error('Persian Calendar view is not open. Please open the Persian Calendar first.');
                }
            },
        });
        this.addCommand({
            id: 'open-current-years-note',
            name: 'Yearly - باز کردن سال‌نوشت امسال',
            callback: async () => {
                const today = new Date();
                const todayJalaali = toJalaali(today);
                const jy = todayJalaali.jy;        
                const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
                if (leaf) {
                    const view = leaf.view;
                    if (view instanceof PersianCalendarView) {
                        await view.openOrCreateYearlyNote(jy);
                    }
                } else {
                    console.error('Persian Calendar view is not open. Please open the Persian Calendar first.');
                }
            },
        });
        

        const openNoteForDate = (year: number, month: number, dayNumber: number) => {
            const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
            if (leaf) {
                const view = leaf.view;
                if (view instanceof PersianCalendarView) {
                    view.openOrCreateDailyNote(dayNumber);
                }
            } else {
                console.error('Persian Calendar view is not open.');
            }
        };

        
        
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    private calculateCurrentWeekNumber(jalaaliDate: {jy: number, jm: number, jd: number}): number {
        // Ensure moment-jalaali uses the Jalaali calendar
        moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});
    
        // Use the current date to create a moment-jalaali object
        const currentDate = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD');
    
        // Get the Jalaali week number for the current date
        const currentWeekNumber = currentDate.jWeek();
    
        // Return the current week number
        return currentWeekNumber;
    }
}

class PersianCalendarSettingTab extends PluginSettingTab {
    plugin: PersianCalendarPlugin;

    constructor(app: App, plugin: PersianCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // Daily Note Settings
        containerEl.createEl('h3', { text: 'Notes path' });
        containerEl.createEl('p', { text: 'You can define periodic notes path here. Dont put "/" at start of path.' });
        containerEl.createEl('p', { text: 'مسیر نوشته‌ها را میتوانید از طریق تنظیمات زیر تعیین کنید و اول مسیر "/" نگذارید' });
        this.addPathSetting(containerEl, 'Daily Note Path - مسیر روزنوشت‌ها', 'dailyNotesFolderPath');
        this.addPathSetting(containerEl, 'Weekly Note Path - مسیر هفته‌نوشت‌ها', 'weeklyNotesFolderPath');
        this.addPathSetting(containerEl, 'Monthly Note Path - مسیر ماه‌نوشت‌ها', 'monthlyNotesFolderPath');
        this.addPathSetting(containerEl, 'Yearly Note Path - مسیر سال‌نوشت‌ها', 'yearlyNotesFolderPath');
        const paragraph = containerEl.createEl('p');
        paragraph.appendText('در صورت مشاهده باگ و یا داشتن ایده می‌توانید در گیت‌هاب و کارفکر به اشتراک بگذارید');
        paragraph.createEl('a', { text: 'Karfekr Forum', href: 'https://forum.Karfekr.ir' });
        paragraph.appendText('.');
        paragraph.createEl('br');
        paragraph.appendText('توسعه‌یافته توسط حسین ملک نژاد، برای حمایت کارفکر را دنبال کنید:');
        paragraph.createEl('a', { text: 'Karfekr', href: 'https://Karfekr.ir' });
        paragraph.appendText('.');
    }

    addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof PluginSettings) {
        new Setting(containerEl)
            .setName(name)
            .addText(text => text
                .setPlaceholder('Path/for/notes')
                .setValue(this.plugin.settings[settingKey])
                .onChange(async (value) => {
                    this.plugin.settings[settingKey] = value;
                    await this.plugin.saveSettings();
                }));
    }
}

