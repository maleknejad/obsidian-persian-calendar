// TODO: cleanup

import {
	Plugin,
	MarkdownView,
	Editor,
	WorkspaceLeaf,
	TFile,
	App,
	type PluginManifest,
	TFolder,
	debounce,
	TAbstractFile,
} from "obsidian";
import { DateSuggester, Placeholder, NoteService } from "./services";
import CalendarView from "./templates/CalendarView";
import Settings from "./templates/Settings";
import RTLNotice from "./components/RTLNotice";
import { DEFAULT_SETTING } from "./constants";
import {
	dateToJWeekNumber,
	addDayDate,
	dateToJalali,
	gregorianDashToJalaliDash,
	jalaliDashToGregorianDash,
	jalaliToSeason,
} from "./utils/dateUtils";
import type { TSetting } from "./types";

export default class PersianCalendarPlugin extends Plugin {
	settings: TSetting = DEFAULT_SETTING;
	dateSuggester: DateSuggester | undefined;
	placeholder: Placeholder;
	pluginsettingstab: Settings | undefined;
	plugin: PersianCalendarPlugin = this;
	view: CalendarView | undefined;
	noteService!: NoteService;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new Placeholder(this);
	}

	async onload() {
		await this.loadSettings();

		this.noteService = new NoteService(this.app, this);

		this.app.workspace.onLayoutReady(async () => {
			if (this.settings.openDailyNoteOnStartup) {
				const now = new Date();
				const { jy, jm, jd } = dateToJalali(now);
				await this.noteService.openOrCreateDailyNote(jy, jm, jd);
			}
		});

		this.registerView(
			"persian-calendar",
			(leaf: WorkspaceLeaf) => (this.view = new CalendarView(leaf, this.app, this)),
		);

		if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
			this.activateView();
		}

		super.onload();

		this.registerEditorSuggest(new DateSuggester(this));

		this.settings.dateFormat;

		this.dateSuggester = new DateSuggester(this);

		this.pluginsettingstab = new Settings(this.app, this);

		this.checkForVersionUpdate();

		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate();
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if ((file instanceof TFile && file.path.endsWith(".md")) || file instanceof TFolder) {
					this.handleFileUpdate();
				}
			}),
		);

		this.addSettingTab(new Settings(this.app, this));

		this.addCommand({
			id: "replace-persian-placeholders",
			name: "Replace Placeholders - جایگزینی عبارات معنادار در این یادداشت",
			editorCallback: async (editor, view) => {
				if (view.file) {
					await this.placeholder.insertPersianDate(view.file);
					RTLNotice("جایگزینی با موفقیت انجام شد.");
				}
			},
		});

		this.addCommand({
			id: "open-todays-daily-note",
			name: "Today - باز کردن روزنوشت امروز",
			callback: async () => {
				openNoteForDate(new Date());
			},
		});

		this.addCommand({
			id: "open-tomorrow-daily-note",
			name: "Tomorrow - باز کردن روزنوشت فردا",
			callback: async () => {
				openNoteForDate(addDayDate(new Date(), 1));
			},
		});

		this.addCommand({
			id: "open-yesterday-daily-note",
			name: "Yesterday - باز کردن روزنوشت دیروز",
			callback: async () => {
				openNoteForDate(addDayDate(new Date(), -1));
			},
		});

		this.addCommand({
			id: "open-persian-calendar-view",
			name: "Open Persian Calendar View - باز کردن تقویم فارسی",
			callback: async () => {
				await this.activateView();
			},
		});

		this.addCommand({
			id: "open-this-weeks-note",
			name: "Weekly - باز کردن هفته‌نوشت این هفته",
			callback: async () => {
				const now = new Date();
				const { jy } = dateToJalali(now);
				const currentWeekNumber = dateToJWeekNumber(now);

				await this.noteService.openOrCreateWeeklyNote(jy, currentWeekNumber);
			},
		});

		this.addCommand({
			id: "open-current-seasonal-note",
			name: "seasonal - باز کردن فصل نوشت این فصل",
			callback: async () => {
				const now = new Date();
				const { jy, jm } = dateToJalali(now);
				const season = jalaliToSeason(jm);

				await this.noteService.openOrCreateSeasonalNote(jy, season);
			},
		});

		this.addCommand({
			id: "open-current-months-note",
			name: "Monthly - بازکردن ماه‌نوشت این ماه",
			callback: async () => {
				const { jy, jm } = dateToJalali(new Date());
				await this.noteService.openOrCreateMonthlyNote(jy, jm);
			},
		});

		this.addCommand({
			id: "open-current-years-note",
			name: "Yearly - باز کردن سال‌نوشت امسال",
			callback: async () => {
				const { jy } = dateToJalali(new Date());
				await this.noteService.openOrCreateYearlyNote(jy);
			},
		});

		const openNoteForDate = async (date: Date) => {
			const { jy, jm, jd } = dateToJalali(date);
			await this.noteService.openOrCreateDailyNote(jy, jm, jd);
		};

		this.addCommand({
			id: "convert-date",
			name: "Convert Date Format - تبدیل تاریخ بین شمسی و میلادی",
			checkCallback: (checking: boolean) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				if (!editor) return false;

				const { line } = editor.getCursor();
				const text = editor.getLine(line);

				if (!/^\b\d{4}-?\d{2}-?\d{2}\b$/.test(text)) return false;

				if (!checking) {
					this.convertDate(editor, line, text);
				}

				return true;
			},
		});
	}

	// TODO: change this
	public convertDate(editor: Editor, lineIndex: number, textLine: string) {
		const dateRegex = /\b(\d{4})-?(\d{2})-?(\d{2})\b/g;

		const newLine = textLine.replace(dateRegex, (full, y, m, d) => {
			const date = `${y}-${m}-${d}`;
			const convert = +y > 2000 ? gregorianDashToJalaliDash : jalaliDashToGregorianDash;

			return convert(date) ?? full;
		});

		if (newLine !== textLine) {
			editor.replaceRange(
				newLine,
				{ line: lineIndex, ch: 0 },
				{ line: lineIndex, ch: textLine.length },
			);
		}
	}

	private async checkForVersionUpdate(): Promise<void> {
		const currentVersion = this.manifest.version;
		const lastSeenVersion = this.settings.lastSeenVersion;

		if (this.settings.versionUpdate === false) {
			if (lastSeenVersion !== currentVersion) {
				this.settings.lastSeenVersion = currentVersion;
				await this.saveSettings();
			}
			return;
		}

		if (!lastSeenVersion) {
			const { getReleaseNotesForVersion, isReleaseNote } = await import("src/utils/release");

			if (!isReleaseNote(currentVersion)) {
				this.settings.lastSeenVersion = currentVersion;
				await this.saveSettings();
				return;
			}

			const { UpdateModal } = await import("src/components/UpdateModal");
			const releaseNotes = getReleaseNotesForVersion(currentVersion);

			new UpdateModal(this.app, releaseNotes, () => {
				this.settings.lastSeenVersion = currentVersion;
				this.saveSettings().catch(console.error);
			}).open();

			return;
		}

		if (lastSeenVersion === currentVersion) {
			return;
		}

		const {
			getReleaseNotesBetweenVersions,
			getLatestReleaseNotes,
			compareVersions,
			isReleaseNote,
		} = await import("src/utils/release");

		if (!isReleaseNote(currentVersion)) {
			this.settings.lastSeenVersion = currentVersion;
			await this.saveSettings();
			return;
		}

		const { UpdateModal } = await import("src/components/UpdateModal");

		let releaseNotes;
		if (compareVersions(currentVersion, lastSeenVersion) > 0) {
			releaseNotes = getReleaseNotesBetweenVersions(lastSeenVersion, currentVersion);
		} else {
			releaseNotes = getLatestReleaseNotes();
		}

		new UpdateModal(this.app, releaseNotes, () => {
			this.settings.lastSeenVersion = currentVersion;
			this.saveSettings().catch(console.error);
		}).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTING, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private handleFileUpdate() {
		const debouncedRefresh = debounce(() => {
			const leaves = this.app.workspace.getLeavesOfType("persian-calendar");
			leaves.forEach((leaf) => {
				if (leaf.view instanceof CalendarView) {
					leaf.view.refreshCalendar();
				}
			});
		}, 50);

		debouncedRefresh();
	}

	async activateView(): Promise<WorkspaceLeaf | null> {
		const existingLeaves = this.app.workspace.getLeavesOfType("persian-calendar");
		if (existingLeaves.length > 0) {
			this.app.workspace.revealLeaf(existingLeaves[0]);
			return existingLeaves[0];
		}

		const leaf =
			this.app.workspace.getRightLeaf(false) ??
			this.app.workspace.getRightLeaf(true) ??
			this.app.workspace.getLeaf("tab");

		await leaf.setViewState({
			type: "persian-calendar",
			active: true,
		});

		this.app.workspace.revealLeaf(leaf);
		return leaf;
	}

	refreshViews() {
		if (this.app.workspace.getLeavesOfType("persian-calendar").length > 0) {
			this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => {
				if (leaf.view instanceof CalendarView) {
					leaf.view.render();
				}
			});
		}
	}

	onunload() {
		this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => leaf.detach());
	}
}
