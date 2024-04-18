import { Notice, Plugin, PluginSettingTab, Setting, App, TFile } from 'obsidian';
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
        

        this.registerEvent(this.app.vault.on('create', (file) => {
            if (file instanceof TFile && file.path.endsWith('.md')) {
                this.handleFileUpdate(file, true);
            }
        }));

        this.registerEvent(this.app.vault.on('delete', (file) => {
            if (file instanceof TFile && file.path.endsWith('.md')) {
                this.handleFileUpdate(file, false);
            }
        }));


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
            id: 'open-persian-calendar-view',
            name: 'Open Persian Calendar View - باز کردن تقویم فارسی',
            callback: async () => {
                await this.activateView();
            },
        });

        this.addCommand({
            id: 'open-this-weeks-note',
            name: 'Weekly - باز کردن هفته‌نوشت این هفته',
            callback: async () => {
                const today = new Date();
                const todayJalaali = toJalaali(today); 
                const currentWeekNumber = this.calculateCurrentWeekNumber(todayJalaali);
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
            id: 'open-current-quarterly-note',
            name: 'ْQuarterly - باز کردن فصل نوشت این فصل',
            callback: async () => {
                const leaf = this.app.workspace.getLeavesOfType('persian-calendar')[0];
                if (leaf && leaf.view instanceof PersianCalendarView) {
                    const { quarter, jy } = leaf.view.getCurrentQuarter();
                    await leaf.view.openOrCreateQuarterlyNote(quarter, jy);
                } else {
                    new Notice('Persian Calendar view is not open. Please open the Persian Calendar first.');
                }
            },
        });


        this.addCommand({
            id: 'open-current-months-note',
            name: 'Monthly - بازکردن ماه‌نوشت این ماه',
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
    
    private async handleFileUpdate(file: TFile, isCreation: boolean): Promise<void> {
        const view = this.app.workspace.getLeavesOfType('persian-calendar')[0]?.view;
        if (view instanceof PersianCalendarView) {
            view.refreshCalendarDots(file, isCreation);
        }
    }


    private calculateCurrentWeekNumber(jalaaliDate: {jy: number, jm: number, jd: number}): number {
        moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});    
        const currentDate = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD');
        const currentWeekNumber = currentDate.jWeek();
        return currentWeekNumber;
    }
    private async activateView() {
        let leaf = this.app.workspace.getLeavesOfType('persian-calendar').first();
        
        if (!leaf) {
            leaf = this.app.workspace.getRightLeaf(false);
            await leaf.setViewState({
                type: 'persian-calendar',
            });
        }

        if (!leaf || !(leaf.view instanceof PersianCalendarView)) {
            new Notice('Unable to open Persian Calendar view. Please make sure the plugin is correctly installed from community plugins directroy.');
            return;
        }

        this.app.workspace.revealLeaf(leaf);
        leaf.view.focus();
    }

    refreshViews() {
        if (this.app.workspace.getLeavesOfType('persian-calendar').length > 0) {
            this.app.workspace.getLeavesOfType('persian-calendar').forEach(leaf => {
                if (leaf.view instanceof PersianCalendarView) {
                    leaf.view.render(); 
                }
            });
        }
    }
}

class PersianCalendarSettingTab extends PluginSettingTab {
    plugin: PersianCalendarPlugin;

    constructor(app: App, plugin: PersianCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.addPathSetting = this.addPathSetting.bind(this);
        
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
    
        containerEl.setAttribute('dir', 'rtl');
         
        containerEl.createEl('h3', { text: 'تنظیمات تقویم' });
        containerEl.createEl('p', { text: 'مسیر ساختن نوشته‌ها را میتوانید از طریق تنظیمات زیر تعیین کنید.' });
    
         
        this.addPathSetting(containerEl, 'مسیر روزنوشت‌ها', 'dailyNotesFolderPath');
        new Setting(containerEl)
        .setName('فرمت نام‌گذاری و شناسایی روزنوشت‌ها')
        .setDesc('مشخص کنید روزنوشت‌ها با چه فرمتی نام‌گذاری شوند. این نام در Title روزنوشت‌ها قرار می‌گیرد.')
        .addDropdown(dropdown => dropdown
            .addOption('persian', 'خورشیدی')
            .addOption('georgian', 'میلادی')
            .setValue(this.plugin.settings.dateFormat || 'georgian')
            .onChange(async (value) => {
                this.plugin.settings.dateFormat = value;
                await this.plugin.saveSettings();
                this.plugin.refreshViews();  // Optionally refresh views if necessary
            }));
        this.addPathSetting(containerEl, 'مسیر هفته‌نوشت‌ها', 'weeklyNotesFolderPath');
        this.addPathSetting(containerEl, 'مسیر ماه‌نوشت‌ها', 'monthlyNotesFolderPath');
        this.addPathSetting(containerEl, 'مسیر فصل‌نوشت‌ها', 'quarterlyNotesFolderPath');
        new Setting(containerEl)
            .setName('فعال‌سازی نمایش فصل‌نوشت‌ها در تقویم')
            .setDesc('نمایش یا پنهان کردن ردیف فصل‌نوشت‌ها در نمای تقویم')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableQuarterlyNotes)
                .onChange(async (value) => {
                    this.plugin.settings.enableQuarterlyNotes = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));
        this.addPathSetting(containerEl, 'مسیر سال‌نوشت‌ها', 'yearlyNotesFolderPath');
         
        
    
        
            

        containerEl.createEl('p', { text: 'مسیرها را قبل از تنظیم کردن در ابسیدین ایجاد کنید. مسیرها باید بدون "/" در ابتدای آن باشد.' });
        containerEl.createEl('p', { text: 'برای اعمال تغییرات، لازم است تقویم را از تنظیمات ابسیدین مجددا فعال کنید.' });
        const templaterparagraph = containerEl.createEl('p');
        templaterparagraph.appendText('برای تنظیم کردن قالب برای نوشته‌ها می‌توانید از افزونه ');
        templaterparagraph.createEl('a', { text: 'Templater', href: 'https://github.com/SilentVoid13/Templater' }),
        templaterparagraph.appendText(' استفاده کنید. راهنمای استفاده از آن در گیت‌هاب نوشته شده است.');
        const paragraph = containerEl.createEl('p');
        paragraph.appendText('در صورت مشاهده باگ و یا ارائه پیشنهاد و یا درخواست راهنمایی لطفا در ');
        paragraph.createEl('a', { text: 'گیت‌هاب', href: 'https://github.com/maleknejad/obsidian-persian-calendar/' }),
        paragraph.appendText(' به اشتراک بگذارید.'),
        paragraph.createEl('br'),
        paragraph.createEl('br'),
        paragraph.createEl('br'),
        paragraph.appendText(' ‌توسعه‌یافته توسط حسین ملک نژاد، برای حمایت و پیگیری توسعه پلاگین‌های ابسیدین '),
        paragraph.createEl('a', { text: 'کارفکر', href: 'https://karfekr.ir' }),
        paragraph.appendText(' را دنبال کنید.'),
        paragraph.createEl('br'),
        paragraph.appendText(' نسخه 1.1.0');
    }
    

    addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof PluginSettings) {
        new Setting(containerEl)
            .setName(name)
            .addText(text => text
                .setPlaceholder('Path/for/notes')
                .setValue(this.plugin.settings[settingKey] as string)
                .onChange(async (value) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this.plugin.settings as any)[settingKey] = value;
                    await this.plugin.saveSettings();
                }));
    }
      
}
