import { Plugin, App, type PluginManifest, WorkspaceLeaf } from "obsidian";
import {
	SmartDateLinker,
	Placeholder,
	NoteService,
	CommandRegistry,
	EventManager,
	VersionChecker,
} from "./services";
import CalendarView from "./templates/CalendarView";
import Settings from "./templates/Settings";
import { DEFAULT_SETTING } from "./constants";
import { dateToJalali, todayTehran } from "./utils/dateUtils";
import type { TSetting } from "./types";
import RTLNotice from "./components/RTLNotice";
import Suggestion from "./services/Suggestion";

export default class PersianCalendarPlugin extends Plugin {
	// Core properties
	settings: TSetting = DEFAULT_SETTING;
	noteService!: NoteService;
	placeholder: Placeholder;
	dateSuggester?: SmartDateLinker;

	// Managers
	commandRegistry!: CommandRegistry;
	eventManager!: EventManager;
	versionChecker!: VersionChecker;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new Placeholder(this);
	}

	async onload() {
		// Initialize services
		this.initializeServices();

		// Load settings
		await this.loadSettings();

		// Initialize note service
		this.noteService = new NoteService(this.app, this);

		// Handle startup operations
		this.handleStartup();

		// Register calendar view
		this.registerView("persian-calendar", (leaf) => new CalendarView(leaf, this.app, this));

		// Activate view if not already active
		this.app.workspace.onLayoutReady(async () => {
			if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
				await this.activateView();
			}
		});

		// Call parent onload
		super.onload();

		// Register editor suggester
		this.dateSuggester = new SmartDateLinker(this);
		this.registerEditorSuggest(
			new Suggestion(this.app, [this.dateSuggester.toProvider(), this.placeholder.toProvider()]),
		);

		// Register events
		this.eventManager.registerEvents();

		// Register settings tab
		this.addSettingTab(new Settings(this.app, this));

		// Register commands
		this.commandRegistry.registerAllCommands();

		// Check for version updates
		await this.versionChecker.checkForVersionUpdate();
	}

	private initializeServices() {
		this.commandRegistry = new CommandRegistry(this);
		this.eventManager = new EventManager(this);
		this.versionChecker = new VersionChecker(this);
	}

	private handleStartup() {
		this.app.workspace.onLayoutReady(async () => {
			if (this.settings.openDailyNoteOnStartup) {
				const now = todayTehran();
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

	async activateView(): Promise<WorkspaceLeaf | null> {
		const existingLeaves = this.app.workspace.getLeavesOfType("persian-calendar");

		if (existingLeaves.length > 0) {
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return existingLeaves[0];
		}

		try {
			const rightLeaf = this.app.workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: "persian-calendar",
					active: true,
				});
				this.app.workspace.revealLeaf(rightLeaf);
				return rightLeaf;
			}
		} catch (e) {
			RTLNotice("خطا در باز کردن نمای تقویم.");
		}

		const leaf = this.app.workspace.getLeaf("split", "vertical");

		await leaf.setViewState({
			type: "persian-calendar",
			active: true,
		});

		this.app.workspace.revealLeaf(leaf);
		return leaf;
	}

	refreshViews() {
		const leaves = this.app.workspace.getLeavesOfType("persian-calendar");

		leaves.forEach((leaf) => {
			if (leaf.view instanceof CalendarView) {
				leaf.view.render();
			}
		});
	}

	onunload() {
		this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => leaf.detach());
	}
}
