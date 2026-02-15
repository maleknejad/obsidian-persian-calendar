import { Plugin, App, type PluginManifest } from "obsidian";
import { DateSuggester, Placeholder, NoteService } from "./services";
import CalendarView from "./templates/CalendarView";
import Settings from "./templates/Settings";
import { DEFAULT_SETTING } from "./constants";
import { dateToJalali } from "./utils/dateUtils";
import type { TSetting } from "./types";
import { CommandRegistry, EventManager, VersionChecker } from "./services";

export default class PersianCalendarPlugin extends Plugin {
	// Core properties
	settings: TSetting = DEFAULT_SETTING;
	noteService!: NoteService;
	placeholder: Placeholder;
	dateSuggester: DateSuggester | undefined;

	// Managers
	commandRegistry!: CommandRegistry;
	eventManager!: EventManager;
	versionChecker!: VersionChecker;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new Placeholder(this);
	}

	async onload() {
		this.initializeManagers();

		await this.loadSettings();

		this.noteService = new NoteService(this.app, this);

		this.handleStartup();

		this.registerView("persian-calendar", (leaf) => new CalendarView(leaf, this.app, this));

		if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
			await CalendarView.activateView(this);
		}

		super.onload();

		this.registerEditorSuggest(new DateSuggester(this));
		this.dateSuggester = new DateSuggester(this);

		this.eventManager.registerEvents();

		this.addSettingTab(new Settings(this.app, this));

		this.commandRegistry.registerAllCommands();

		await this.versionChecker.checkForVersionUpdate();
	}

	private initializeManagers(): void {
		this.commandRegistry = new CommandRegistry(this);
		this.eventManager = new EventManager(this);
		this.versionChecker = new VersionChecker(this);
	}

	private handleStartup(): void {
		this.app.workspace.onLayoutReady(async () => {
			if (this.settings.openDailyNoteOnStartup) {
				const now = new Date();
				const { jy, jm, jd } = dateToJalali(now);
				await this.noteService.openOrCreateDailyNote(jy, jm, jd);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTING, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshViews() {
		CalendarView.refreshAllViews(this);
	}

	onunload() {
		CalendarView.detachAllViews(this);
	}
}
