import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import PersianCalendarView from './view';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';


export default class PersianCalendarPlugin extends Plugin {
    settings: PluginSettings = DEFAULT_SETTINGS;
    
    async onload() {
        await this.loadSettings();
        this.registerView('persian-calendar', (leaf) => new PersianCalendarView(leaf, this.app, this.settings));
        this.addRibbonIcon('calendar', 'Open Persian Calendar', () => this.activateView());
        this.addSettingTab(new PersianCalendarSettingTab(this.app, this));
        this.addCommand({
            id: 'open-persian-calendar',
            name: 'Open Persian Calendar',
            callback: () => this.activateView(),
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async activateView() {
        if (this.app.workspace.getLeavesOfType('persian-calendar').length === 0) {
            await this.app.workspace.getRightLeaf(false).setViewState({ type: 'persian-calendar' });
            this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType('persian-calendar')[0]);
        }
    }
    async onClose(): Promise<void> {
        console.log("Persian Calendar is closing");
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
        containerEl.createEl('h3', { text: 'Notes Path' });
        this.addPathSetting(containerEl, 'Daily Note Path', 'dailyNotesFolderPath');
        this.addPathSetting(containerEl, 'Weekly Note Path', 'weeklyNotesFolderPath');
        this.addPathSetting(containerEl, 'Monthly Note Path', 'monthlyNotesFolderPath');
        this.addPathSetting(containerEl, 'Yearly Note Path', 'yearlyNotesFolderPath');

    }

    addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof PluginSettings) {
        new Setting(containerEl)
            .setName(name)
            .addText(text => text
                .setPlaceholder('Path/to/notes')
                .setValue(this.plugin.settings[settingKey])
                .onChange(async (value) => {
                    this.plugin.settings[settingKey] = value;
                    await this.plugin.saveSettings();
                }));
    }
}

