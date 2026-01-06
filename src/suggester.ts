import {
	EditorSuggest,
	Editor,
	MarkdownView,
	Notice,
	TFile,
	type EditorPosition,
	type EditorSuggestTriggerInfo,
	type EditorSuggestContext,
} from "obsidian";
import PersianCalendarPlugin from "src/main";
import {
	dateToJMonthDash,
	dateToJQuarterDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToJalaliDash,
} from "src/utils/dateConverter";

export default class DateSuggester extends EditorSuggest<string> {
	plugin: PersianCalendarPlugin;

	constructor(plugin: PersianCalendarPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const atIndex = line.lastIndexOf("@", cursor.ch);
		if (atIndex !== -1 && atIndex < cursor.ch) {
			return {
				start: { line: cursor.line, ch: atIndex },
				end: cursor,
				query: line.substring(atIndex + 1, cursor.ch),
			};
		}
		return null;
	}

	getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
		const query = context.query.toLowerCase();
		const suggestions = [
			"امروز",
			"فردا",
			"دیروز",
			"پریروز",
			"پس‌فردا",
			"شنبه",
			"شنبه بعد",
			"شنبه قبل",
			"یکشنبه",
			"یکشنبه بعد",
			"یکشنبه قبل",
			"دوشنبه",
			"دوشنبه بعد",
			"دوشنبه قبل",
			"سه‌شنبه",
			"سه‌شنبه بعد",
			"سه‌شنبه قبل",
			"چهارشنبه",
			"چهارشنبه بعد",
			"چهارشنبه قبل",
			"پنج‌شنبه",
			"پنج‌شنبه بعد",
			"پنج‌شنبه قبل",
			"جمعه",
			"جمعه بعد",
			"جمعه قبل",
			"این هفته",
			"هفته قبل",
			"هفته بعد",
			"این ماه",
			"ماه قبل",
			"ماه بعد",
			"این فصل",
			"فصل قبل",
			"فصل بعد",
			"امسال",
			"سال قبل",
			"سال بعد",
		];
		return suggestions.filter((suggestion) => suggestion.startsWith(query));
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		const suggestionSpan = el.createSpan();
		suggestionSpan.textContent = value.charAt(0).toUpperCase() + value.slice(1);
	}

	getFormattedDateLink(keyword: string, date: Date) {
		const now = new Date();
		let dateText = "";

		const weekdayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
		const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
		const match = keyword.match(regex);

		if (match) {
			const weekdayName = match[1];
			const specifier = match[2] || "";
			const weekdayIndex = weekdayNames.indexOf(weekdayName);
			const currentDayOfWeek = now.getDay();
			const daysFromNowToWeekday = (weekdayIndex + 6 - currentDayOfWeek) % 7;

			if (specifier.includes("بعد")) {
				now.setDate(now.getDate() + daysFromNowToWeekday + 7);
			} else if (specifier.includes("قبل")) {
				now.setDate(now.getDate() + daysFromNowToWeekday - 7);
			} else {
				now.setDate(now.getDate() + daysFromNowToWeekday);
			}
			dateText = dateToJalaliDash(now);
			const formatSpecifier = specifier ? ` ${specifier.trim()}` : "";
			return `[[${dateText}|${weekdayName}${formatSpecifier}]]`;
		} else {
			switch (keyword) {
				default:
					return "[تاریخ شناسایی نشد! برای مشاهده راهنما کلیک کنید](https://github.com/maleknejad/obsidian-persian-calendar) ";
				case "امروز":
				case "فردا":
				case "دیروز":
				case "پریروز":
				case "پس‌فردا":
					// prettier-ignore
					const dateAdjustment = {
            "امروز": 0,
            "فردا": 1,
            "دیروز": -1,
            "پریروز": -2,
            "پس‌فردا": 2,
        	}[keyword];

					date.setDate(date.getDate() + dateAdjustment);
					return `[[${dateToJalaliDash(date)}|${keyword}]]`;

				case "این هفته":
					return `[[${dateToJWeekDash(new Date())}|${keyword}]]`;

				case "هفته قبل":
					return `[[${dateToJWeekDash(
						new Date(new Date().setDate(new Date().getDate() - 7)),
					)}|${keyword}]]`;

				case "هفته بعد":
					return `[[${dateToJWeekDash(
						new Date(new Date().setDate(new Date().getDate() + 7)),
					)}|${keyword}]]`;

				case "این ماه":
					return `[[${dateToJMonthDash(new Date())}|${keyword}]]`;

				case "ماه قبل":
					return `[[${dateToJMonthDash(
						new Date(new Date().setMonth(new Date().getMonth() - 1)),
					)}|${keyword}]]`;

				case "ماه بعد":
					return `[[${dateToJMonthDash(
						new Date(new Date().setMonth(new Date().getMonth() + 1)),
					)}|${keyword}]]`;

				case "این فصل":
					return `[[${dateToJQuarterDash(new Date())}|${keyword}]]`;

				case "فصل قبل":
					return `[[${dateToJQuarterDash(
						new Date(new Date().setMonth(new Date().getMonth() - 3)),
					)}|${keyword}]]`;

				case "فصل بعد":
					return `[[${dateToJQuarterDash(
						new Date(new Date().setMonth(new Date().getMonth() + 3)),
					)}|${keyword}]]`;

				case "امسال":
					return `[[${dateToJYearDash(new Date())}|${keyword}]]`;

				case "سال قبل":
					return `[[${dateToJYearDash(
						new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
					)}|${keyword}]]`;

				case "سال بعد":
					return `[[${dateToJYearDash(
						new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
					)}|${keyword}]]`;
			}
		}
	}

	selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
		const now = new Date();
		const linkText = this.getFormattedDateLink(value, now); // Ensures linkText is always a string

		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			if (this.context && this.context.start && this.context.end) {
				editor.replaceRange(linkText, this.context.start, this.context.end);
			} else {
				console.error("EditorSuggest context start or end is null");
			}
		} else {
			console.error("No active markdown editor");
		}
		this.close();
	}
	convertTextToDate(editor: Editor) {
		const selectedText = editor.getSelection();

		if (!selectedText) {
			new Notice("متنی انتخاب نشده است.");
			return;
		}

		let linkText = "";

		try {
			linkText = this.getFormattedDateLink(selectedText, new Date());

			editor.replaceSelection(linkText); // Replace the selected text with the formatted date link
		} catch (error) {
			console.error("Failed to convert text to date:", error);
			new Notice("Failed to convert text to date.");
		}
	}
}
