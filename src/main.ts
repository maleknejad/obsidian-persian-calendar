import {
	Notice,
	Plugin,
	MarkdownView,
	Editor,
	WorkspaceLeaf,
	TFile,
	TAbstractFile,
	App,
	type PluginManifest,
} from "obsidian";
import {
	dateToJWeekNumber,
	addDayDate,
	dateToJalali,
	gregorianDashToJalaliDash,
	jalaliDashToGregorianDash,
	jalaliToSeason,
} from "src/utils/dateUtils";
import type { TPluginSetting } from "src/types";
import { DEFAULT_SETTING } from "src/constants";
import DateSuggester from "src/suggester";
import PersianPlaceholders from "src/placeholder";
import UpdateModal from "./updatemodal";
import PersianCalendarSettingTab from "src/settingstab";
import { NoteService } from "src/services";
import PersianCalendarView from "src/view";

export default class PersianCalendarPlugin extends Plugin {
	settings: TPluginSetting = DEFAULT_SETTING;
	dateSuggester: DateSuggester | undefined;
	placeholder: PersianPlaceholders;
	pluginsettingstab: PersianCalendarSettingTab | undefined;
	plugin: PersianCalendarPlugin = this;
	view: PersianCalendarView | undefined;
	private noteService: NoteService;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.placeholder = new PersianPlaceholders(this);
		this.noteService = new NoteService(this.app, this.settings);
	}

	async onload() {
		await this.loadSettings();

		this.registerView(
			"persian-calendar",
			(leaf: WorkspaceLeaf) =>
				(this.view = new PersianCalendarView(leaf, this.app, this.settings, this.plugin)),
		);

		if (this.app.workspace.getLeavesOfType("persian-calendar").length === 0) {
			this.activateView();
		}

		super.onload();

		this.registerEditorSuggest(new DateSuggester(this));

		this.dateSuggester = new DateSuggester(this);

		this.pluginsettingstab = new PersianCalendarSettingTab(this.app, this);

		this.announceUpdate();

		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (!(file instanceof TFile)) return;
				if (file.extension !== "md") return;

				const content = await this.app.vault.read(file);

				if (content.includes("{{tp_")) return;

				await this.placeholder.insertPersianDate(file);
			}),
		);

		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate();
					const fileCreationTime = file.stat.ctime;
					const now = Date.now();
					const timeDiff = now - fileCreationTime;

					if (timeDiff < 2000) {
						if (this.placeholder) {
							this.placeholder.insertPersianDate(file);
						}
					}
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate();
				}
			}),
		);

		this.addSettingTab(new PersianCalendarSettingTab(this.app, this));

		this.addCommand({
			id: "replace-persian-placeholders",
			name: "Replace Placeholders - جایگزینی عبارات معنادار در این یادداشت",
			editorCallback: async (editor, view) => {
				if (view.file) {
					await this.placeholder?.insertPersianDate(view.file);
					new Notice("جایگزینی با موفقیت انجام شد");
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

				await this.noteService.openOrCreateWeeklyNote(currentWeekNumber, jy);
			},
		});

		this.addCommand({
			id: "open-current-seasonal-note",
			name: "seasonal - باز کردن فصل نوشت این فصل",
			callback: async () => {
				const now = new Date();
				const { jy, jm } = dateToJalali(now);
				const season = jalaliToSeason(jm);

				await this.noteService.openOrCreateSeasonalNote(season, jy);
			},
		});

		this.addCommand({
			id: "open-current-months-note",
			name: "Monthly - بازکردن ماه‌نوشت این ماه",
			callback: async () => {
				const { jy, jm } = dateToJalali(new Date());
				await this.noteService.openOrCreateMonthlyNote(jm, jy);
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

		this.addCommand({
			id: "convert-to-date",
			name: "Link Text to Periodic Note - ارجاع متن به یادداشت‌های دوره‌ای",
			editorCallback: (editor) => {
				this.dateSuggester?.convertTextToDate(editor);
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

	// todo: change this
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

	private announceUpdate(): void {
		const currentVersion = this.manifest.version;
		const knownVersion = this.settings.version;
		if (currentVersion === knownVersion) return;
		this.settings.version = currentVersion;
		void this.saveSettings();
		if (this.settings.announceUpdates === false) return;
		const updateModal = new UpdateModal(this.app);
		updateModal.open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTING, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleFileUpdate(): Promise<void> {
		const view = this.app.workspace.getLeavesOfType("persian-calendar")[0]?.view;
		if (view instanceof PersianCalendarView) {
			view.refreshCalendar();
		}
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
				if (leaf.view instanceof PersianCalendarView) {
					leaf.view.render();
				}
			});
		}
	}

	onunload(): void {
		this.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => leaf.detach());
	}
}
