import { Editor, MarkdownView } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import {
	dateToJalali,
	dateToJWeekNumber,
	addDayDate,
	jalaliToSeason,
	gregorianDashToJalaliDash,
	jalaliDashToGregorianDash,
} from "src/utils/dateUtils";
import RTLNotice from "src/components/RTLNotice";

export default class CommandRegistry {
	constructor(private plugin: PersianCalendarPlugin) {}

	registerAllCommands() {
		this.registerReplacePlaceholders();
		this.registerDailyNoteCommands();
		this.registerPeriodicNoteCommands();
		this.registerCalendarViewCommand();
		this.registerDateConversionCommand();
	}

	private registerReplacePlaceholders() {
		this.plugin.addCommand({
			id: "replace-persian-placeholders",
			name: "Replace Placeholders - جایگزینی عبارات معنادار در این یادداشت",
			editorCallback: async (editor, view) => {
				if (view.file) {
					await this.plugin.placeholder.insertPersianDate(view.file);
					RTLNotice("جایگزینی با موفقیت انجام شد.");
				}
			},
		});
	}

	private registerDailyNoteCommands() {
		this.plugin.addCommand({
			id: "open-todays-daily-note",
			name: "Today - باز کردن روزنوشت امروز",
			callback: async () => {
				await this.openNoteForDate(new Date());
			},
		});

		this.plugin.addCommand({
			id: "open-tomorrow-daily-note",
			name: "Tomorrow - باز کردن روزنوشت فردا",
			callback: async () => {
				await this.openNoteForDate(addDayDate(new Date(), 1));
			},
		});

		this.plugin.addCommand({
			id: "open-yesterday-daily-note",
			name: "Yesterday - باز کردن روزنوشت دیروز",
			callback: async () => {
				await this.openNoteForDate(addDayDate(new Date(), -1));
			},
		});
	}

	private registerPeriodicNoteCommands() {
		this.plugin.addCommand({
			id: "open-this-weeks-note",
			name: "Weekly - باز کردن هفته‌نوشت این هفته",
			callback: async () => {
				const now = new Date();
				const { jy } = dateToJalali(now);
				const currentWeekNumber = dateToJWeekNumber(now);
				await this.plugin.noteService.openOrCreateWeeklyNote(jy, currentWeekNumber);
			},
		});

		this.plugin.addCommand({
			id: "open-current-seasonal-note",
			name: "seasonal - باز کردن فصل نوشت این فصل",
			callback: async () => {
				const now = new Date();
				const { jy, jm } = dateToJalali(now);
				const season = jalaliToSeason(jm);
				await this.plugin.noteService.openOrCreateSeasonalNote(jy, season);
			},
		});

		this.plugin.addCommand({
			id: "open-current-months-note",
			name: "Monthly - بازکردن ماه‌نوشت این ماه",
			callback: async () => {
				const { jy, jm } = dateToJalali(new Date());
				await this.plugin.noteService.openOrCreateMonthlyNote(jy, jm);
			},
		});

		this.plugin.addCommand({
			id: "open-current-years-note",
			name: "Yearly - باز کردن سال‌نوشت امسال",
			callback: async () => {
				const { jy } = dateToJalali(new Date());
				await this.plugin.noteService.openOrCreateYearlyNote(jy);
			},
		});
	}

	private registerCalendarViewCommand() {
		this.plugin.addCommand({
			id: "open-persian-calendar-view",
			name: "Open Persian Calendar View - باز کردن تقویم فارسی",
			callback: async () => {
				await this.plugin.activateView();
			},
		});
	}

	private registerDateConversionCommand() {
		this.plugin.addCommand({
			id: "convert-date",
			name: "Convert Date Format - تبدیل تاریخ بین شمسی و میلادی",
			checkCallback: (checking: boolean) => {
				const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
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

	private async openNoteForDate(date: Date) {
		const { jy, jm, jd } = dateToJalali(date);
		await this.plugin.noteService.openOrCreateDailyNote(jy, jm, jd);
	}

	private convertDate(editor: Editor, lineIndex: number, textLine: string) {
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
}
