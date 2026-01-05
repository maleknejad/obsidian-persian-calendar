/* eslint-disable no-useless-escape */
import {
	Notice,
	Plugin,
	TFile,
	MarkdownView,
	TAbstractFile,
	Editor,
	WorkspaceLeaf,
} from "obsidian";
import PersianCalendarView from "./view";
import { PluginSettings, DEFAULT_SETTINGS } from "./settings";
import { toJalaali, toGregorian } from "jalaali-js";
import moment from "moment-jalaali";
import DateSuggester from "./suggester";
import PersianPlaceholders from "./placeholder";
import UpdateModal from "./updatemodal";
import PersianCalendarSettingTab from "./settingstab";

//Authored by Hossein Maleknejad, for support and development ideas, follow Karfekr Telegram at https://t.me/karfekr
//I know this repository has lots of duplicate codes and must be cleaned. I will clean it in next releases.
//I am working on it. 1403-04-31

export default class PersianCalendarPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;
	dateSuggester: DateSuggester | undefined;
	placeholder: PersianPlaceholders | undefined;
	pluginsettingstab: PersianCalendarSettingTab | undefined;
	plugin: PersianCalendarPlugin = this;
	view: PersianCalendarView | undefined;

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

		this.addRibbonIcon("calendar", "روزنوشت امروز", async () => {
			const today = new Date();
			const todayJalaali = toJalaali(today);
			const dayNumber = todayJalaali.jd;
			openNoteForDate(todayJalaali.jy, todayJalaali.jm, dayNumber);
		});
		super.onload();
		this.registerEditorSuggest(new DateSuggester(this));
		this.dateSuggester = new DateSuggester(this);
		this.pluginsettingstab = new PersianCalendarSettingTab(this.app, this);
		this.placeholder = new PersianPlaceholders(this);
		this.announceUpdate();

		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate(file, true);
					const fileCreationTime = file.stat.ctime;
					const now = Date.now();
					const timeDiff = now - fileCreationTime;

					if (timeDiff < 10000) {
						if (this.placeholder) {
							this.placeholder.insertPersianDate(file);
						} else {
							console.error("Placeholder is not initialized");
						}
					} else {
						console.log("File is not newly created or too old for processing:", file.path);
					}
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate(file, false);
				}
			}),
		);

		this.addSettingTab(new PersianCalendarSettingTab(this.app, this));
		this.addCommand({
			id: "open-todays-daily-note",
			name: "Today - باز کردن روزنوشت امروز",
			callback: async () => {
				const today = new Date();
				const todayJalaali = toJalaali(today);
				const dayNumber = todayJalaali.jd;
				openNoteForDate(todayJalaali.jy, todayJalaali.jm, dayNumber);
			},
		});
		this.addCommand({
			id: "open-tomorrow-daily-note",
			name: "Tomorrow - باز کردن روزنوشت فردا",
			callback: async () => {
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				const tomorrowJalaali = toJalaali(tomorrow);
				const dayNumber = tomorrowJalaali.jd;
				openNoteForDate(tomorrowJalaali.jy, tomorrowJalaali.jm, dayNumber);
			},
		});
		this.addCommand({
			id: "open-yesterday-daily-note",
			name: "Yesterday - باز کردن روزنوشت دیروز",
			callback: async () => {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				const yesterdayJalaali = toJalaali(yesterday);
				const dayNumber = yesterdayJalaali.jd;
				openNoteForDate(yesterdayJalaali.jy, yesterdayJalaali.jm, dayNumber);
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
				const today = new Date();
				const todayJalaali = toJalaali(today);
				const currentWeekNumber = this.calculateCurrentWeekNumber(todayJalaali);
				const leaf = this.app.workspace.getLeavesOfType("persian-calendar")[0];
				if (leaf) {
					const view = leaf.view;
					if (view instanceof PersianCalendarView) {
						view.openOrCreateWeeklyNote(currentWeekNumber, todayJalaali.jy);
					}
				} else {
					console.error("Persian Calendar view is not open.");
				}
			},
		});

		this.addCommand({
			id: "open-current-quarterly-note",
			name: "ْQuarterly - باز کردن فصل نوشت این فصل",
			callback: async () => {
				const leaf = this.app.workspace.getLeavesOfType("persian-calendar")[0];
				if (leaf && leaf.view instanceof PersianCalendarView) {
					const { quarter, jy } = leaf.view.getCurrentQuarter();
					await leaf.view.openOrCreateQuarterlyNote(quarter, jy);
				} else {
					new Notice("Persian Calendar view is not open. Please open the Persian Calendar first.");
				}
			},
		});

		this.addCommand({
			id: "open-current-months-note",
			name: "Monthly - بازکردن ماه‌نوشت این ماه",
			callback: async () => {
				const today = new Date();
				const todayJalaali = toJalaali(today);
				const jy = todayJalaali.jy;
				const month = todayJalaali.jm;
				const leaf = this.app.workspace.getLeavesOfType("persian-calendar")[0];
				if (leaf) {
					const view = leaf.view;
					if (view instanceof PersianCalendarView) {
						await view.openOrCreateMonthlyNote(month, jy);
					}
				} else {
					console.error(
						"Persian Calendar view is not open. Please open the Persian Calendar first.",
					);
				}
			},
		});
		this.addCommand({
			id: "open-current-years-note",
			name: "Yearly - باز کردن سال‌نوشت امسال",
			callback: async () => {
				const today = new Date();
				const todayJalaali = toJalaali(today);
				const jy = todayJalaali.jy;
				const leaf = this.app.workspace.getLeavesOfType("persian-calendar")[0];
				if (leaf) {
					const view = leaf.view;
					if (view instanceof PersianCalendarView) {
						await view.openOrCreateYearlyNote(jy);
					}
				} else {
					console.error(
						"Persian Calendar view is not open. Please open the Persian Calendar first.",
					);
				}
			},
		});

		this.addCommand({
			id: "convert-date", // For my friend, Amir Napster.
			name: "Convert Date Format - تبدیل تاریخ بین شمسی و میلادی",
			checkCallback: (checking: boolean) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				if (editor) {
					const cursorPos = editor.getCursor();
					const lineText = editor.getLine(cursorPos.line);
					const hasDate = /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{8})/.test(lineText);

					if (checking) {
						return hasDate;
					} else if (hasDate) {
						this.convertDate(editor, cursorPos.line, lineText);
					}
				}
				return false;
			},
		});

		this.addCommand({
			id: "convert-to-date",
			name: "Link Text to Periodic Note - ارجاع متن به یادداشت‌های دوره‌ای",
			editorCallback: (editor, view) => {
				this.dateSuggester?.convertTextToDate(editor);
			},
		});

		const openNoteForDate = (year: number, month: number, dayNumber: number) => {
			const leaf = this.app.workspace.getLeavesOfType("persian-calendar")[0];
			if (leaf) {
				const view = leaf.view;
				if (view instanceof PersianCalendarView) {
					view.openOrCreateDailyNote(dayNumber);
				}
			} else {
				console.error("Persian Calendar view is not open.");
			}
		};
	}

	public convertDate(editor: Editor, lineIndex: number, textLine: string) {
		// eslint-disable-next-line no-useless-escape
		const regex = /(\d{4})[\/\-]?(\d{1,2})[\/\-]?(\d{1,2})/g;
		let match;
		while ((match = regex.exec(textLine)) !== null) {
			const [fullMatch, year, month, day] = match;

			if (parseInt(year) > 1500) {
				const persianDate = toJalaali(parseInt(year), parseInt(month), parseInt(day));
				const formatted = `${persianDate.jy}-${persianDate.jm
					.toString()
					.padStart(2, "0")}-${persianDate.jd.toString().padStart(2, "0")}`;
				editor.replaceRange(
					formatted,
					{ line: lineIndex, ch: match.index },
					{ line: lineIndex, ch: match.index + fullMatch.length },
				);
			} else {
				const georgianDate = toGregorian(parseInt(year), parseInt(month), parseInt(day));
				const formatted = `${georgianDate.gy}-${georgianDate.gm
					.toString()
					.padStart(2, "0")}-${georgianDate.gd.toString().padStart(2, "0")}`;
				editor.replaceRange(
					formatted,
					{ line: lineIndex, ch: match.index },
					{ line: lineIndex, ch: match.index + fullMatch.length },
				);
			}
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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleFileUpdate(file: TFile, isCreation: boolean): Promise<void> {
		const view = this.app.workspace.getLeavesOfType("persian-calendar")[0]?.view;
		if (view instanceof PersianCalendarView) {
			view.refreshCalendarDots(file, isCreation);
		}
	}

	private calculateCurrentWeekNumber(jalaaliDate: { jy: number; jm: number; jd: number }): number {
		moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });
		const currentDate = moment(
			`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`,
			"jYYYY/jM/jD",
		);
		const currentWeekNumber = currentDate.jWeek();
		return currentWeekNumber;
	}
	async activateView() {
		const leaf = this.app.workspace.getRightLeaf(false); // Get a leaf in the right sidebar
		await leaf.setViewState({
			type: "persian-calendar",
			active: true,
		});
		this.app.workspace.revealLeaf(leaf); // Ensure the leaf is visible
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
