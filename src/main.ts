import type { App, PluginManifest, WorkspaceLeaf } from "obsidian";
import { Plugin, setIcon } from "obsidian";
import { setAdapter } from "persian-holidays";
import { DatePicker } from "src/components";

import { DEFAULT_SETTING } from "./constants";
import { onLocalChange, setLocal, t } from "./languages";
import {
	ApiService,
	applySettingsMigrations,
	CommandRegistry,
	EventManager,
	NoteService,
	Placeholder,
	SmartDateLinker,
	Suggestion,
	VersionChecker,
} from "./services";
import CalendarView from "./templates/CalendarView";
import CalendarSettingTab from "./templates/Setting";
import type { TSetting } from "./types";
import { dateToJalali, todayTehran } from "./utils/dateUtils";
import { addClasses } from "./utils/dom";
import { setDefaultEventAdapter } from "./utils/eventUtils/eventAdapter";

export default class PersianCalendarPlugin extends Plugin {
	// Core properties
	setting: TSetting = DEFAULT_SETTING;
	noteService!: NoteService;
	placeholder: Placeholder;
	dateSuggester?: SmartDateLinker;
	datePicker!: DatePicker;
	api!: ReturnType<ApiService["build"]>;

	// Managers
	commandRegistry!: CommandRegistry;
	eventManager!: EventManager;
	versionChecker!: VersionChecker;

	private apiService!: ApiService;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new Placeholder(this);
	}

	async onload() {
		// Initialize services
		this.initializeServices();

		// Load setting
		await this.loadSetting();

		setLocal(this.setting.language);

		setAdapter(setDefaultEventAdapter());

		// Initialize api service
		this.apiService = new ApiService();

		// Initialize note service
		this.noteService = new NoteService(this.app, this);

		// Register calendar view
		this.registerView("persian-calendar", (leaf) => new CalendarView(leaf, this.app, this));

		// Activate view if not already active
		this.app.workspace.onLayoutReady(() => {
			void this.openDailyNoteOnStartup();

			if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
				void this.activateView();
			}
		});

		// inject DatePicker button for Jalali
		const observer = new MutationObserver(() => {
			this.injectDatePickerButton(activeDocument.body);
		});

		observer.observe(activeDocument.body, {
			childList: true,
			subtree: true,
		});

		this.register(() => {
			observer.disconnect();
		});

		// Call parent onload
		void super.onload();

		// Register editor suggester
		this.dateSuggester = new SmartDateLinker(this);
		this.registerEditorSuggest(
			new Suggestion(this.app, [this.dateSuggester.toProvider(), this.placeholder.toProvider()]),
		);

		// Register events
		this.eventManager.registerEvents();

		// Register setting tab
		this.addSettingTab(new CalendarSettingTab(this.app, this));

		// Register commands
		this.commandRegistry.init();

		// Check for version updates
		await this.versionChecker.checkForVersionUpdate();

		this.api = this.apiService.build();
	}

	private initializeServices() {
		this.commandRegistry = new CommandRegistry(this);
		this.eventManager = new EventManager(this);
		this.versionChecker = new VersionChecker(this);
	}

	private async openDailyNoteOnStartup() {
		if (this.setting.openDailyNoteOnStartup) {
			const now = todayTehran();
			const { jy, jm, jd } = dateToJalali(now);
			await this.noteService.openOrCreateDailyNote(jy, jm, jd);
		}
	}

	private injectDatePickerButton(root: HTMLElement) {
		const fields = root.querySelectorAll<HTMLDivElement>(
			'.metadata-property-value[data-property-type="date"]',
		);

		fields.forEach((field) => {
			const existingButton = field.querySelector(".persian-calendar__datepicker-button");
			if (existingButton) return;

			field.dataset.jalaliInjected = "1";

			const input = field.querySelector<HTMLInputElement>('input[type="date"]');
			if (!input) return;

			field.style.display = "flex";
			field.style.alignItems = "center";
			field.style.gap = "6px";

			const btn = document.createElement("button");
			addClasses(btn, "persian-calendar__datepicker-button persian-calendar");
			btn.setAttribute("type", "button");
			field.appendChild(btn);

			setIcon(btn, "calendar-heart");

			const refresh = () => {
				btn.title = t("modal.datePicker.tooltip");
			};

			refresh();
			void onLocalChange(refresh);

			btn.onclick = () => {
				const val = input.value || null;

				new DatePicker(this.app, this.setting, val, (out) => {
					input.focus();

					input.value = out;

					input.dispatchEvent(new InputEvent("input", { bubbles: true }));
					input.dispatchEvent(new Event("change", { bubbles: true }));
				}).open();
			};
		});
	}

	async loadSetting() {
		const data = (await this.loadData()) as Partial<TSetting> | null;
		const merged = { ...DEFAULT_SETTING, ...(data || {}) };

		this.setting = applySettingsMigrations(data, merged);

		if (data?.legacyPathPatternsMigrated !== true) {
			await this.saveSetting();
		}
	}

	async saveSetting() {
		await this.saveData(this.setting);
	}

	async activateView(): Promise<WorkspaceLeaf | null> {
		const existingLeaves = this.app.workspace.getLeavesOfType("persian-calendar");

		if (existingLeaves.length > 0) {
			void this.app.workspace.revealLeaf(existingLeaves[0]);
			return existingLeaves[0];
		}

		const rightLeaf = this.app.workspace.getRightLeaf(false);
		if (rightLeaf) {
			await rightLeaf.setViewState({
				type: "persian-calendar",
				active: true,
			});
			return rightLeaf;
		}

		return null;
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
		this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => {
			leaf.detach();
		});
	}
}
