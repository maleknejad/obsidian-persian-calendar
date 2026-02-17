import {
	EditorSuggest,
	Editor,
	MarkdownView,
	type EditorPosition,
	type EditorSuggestTriggerInfo,
	type EditorSuggestContext,
} from "obsidian";
import PersianCalendarPlugin from "src/main";
import {
	dateToJMonthDash,
	dateToSeasonDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToDash,
	todayTehran,
} from "src/utils/dateUtils";
import { WEEKDAYS_NAME } from "src/constants";
import type { TDateFormat, TLocal } from "src/types";

export default class DateSuggester extends EditorSuggest<string> {
	plugin: PersianCalendarPlugin;
	dateFormat: Omit<TDateFormat, "hijri">;

	constructor(plugin: PersianCalendarPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.dateFormat = plugin.settings.dateFormat;
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
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

	renderSuggestion(value: string, el: HTMLElement) {
		const suggestionSpan = el.createSpan();
		suggestionSpan.textContent = value.charAt(0).toUpperCase() + value.slice(1);
	}

	getFormattedDateLink(keyword: string, date: Date, local: TLocal = "fa") {
		const now = todayTehran();

		const weekdaysName = WEEKDAYS_NAME[local];

		const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
		const match = keyword.match(regex);

		if (match) {
			const weekdayName = match[1];
			const specifier = match[2] || "";

			const weekdayEntry = Object.entries(weekdaysName).find(([, name]) => name === weekdayName);

			if (!weekdayEntry) {
				return "[تاریخ شناسایی نشد! برای مشاهده راهنما کلیک کنید](https://github.com/maleknejad/obsidian-persian-calendar)";
			}

			const weekdayIndex = Number(weekdayEntry[0]); // 1..7
			const currentDayOfWeek = now.getDay(); // 0..6 (Sun..Sat)

			const todayIndex = currentDayOfWeek === 6 ? 1 : currentDayOfWeek + 2;

			const daysFromNowToWeekday = (weekdayIndex - todayIndex + 7) % 7;

			if (specifier.includes("بعد")) {
				now.setDate(now.getDate() + daysFromNowToWeekday + 7);
			} else if (specifier.includes("قبل")) {
				now.setDate(now.getDate() + daysFromNowToWeekday - 7);
			} else {
				now.setDate(now.getDate() + daysFromNowToWeekday);
			}

			const gDateDash = dateToDash(now, "gregorian");

			const formatSpecifier = specifier ? ` ${specifier.trim()}` : "";

			if (this.dateFormat === "gregorian") {
				return `[[${gDateDash}|${weekdayName}${formatSpecifier}]]`;
			}

			return `[[${dateToDash(now, "jalali")}|${weekdayName}${formatSpecifier}]]`;
		}

		switch (keyword) {
			default:
				return "[تاریخ شناسایی نشد! برای مشاهده راهنما کلیک کنید](https://github.com/maleknejad/obsidian-persian-calendar) ";

			case "امروز":
			case "فردا":
			case "دیروز":
			case "پریروز":
			case "پس‌فردا":
				const dateAdjustment = {
					امروز: 0,
					فردا: 1,
					دیروز: -1,
					پریروز: -2,
					پس‌فردا: 2,
				}[keyword];

				date.setDate(date.getDate() + dateAdjustment);
				if (this.dateFormat === "gregorian") {
					return `[[${dateToDash(date, "gregorian")}|${keyword}]]`;
				}

				return `[[${dateToDash(date, "jalali")}|${keyword}]]`;

			case "این هفته":
				return `[[${dateToJWeekDash(todayTehran())}|${keyword}]]`;

			case "هفته قبل":
				return `[[${dateToJWeekDash(
					new Date(todayTehran().setDate(todayTehran().getDate() - 7)),
				)}|${keyword}]]`;

			case "هفته بعد":
				return `[[${dateToJWeekDash(
					new Date(todayTehran().setDate(todayTehran().getDate() + 7)),
				)}|${keyword}]]`;

			case "این ماه":
				return `[[${dateToJMonthDash(todayTehran())}|${keyword}]]`;

			case "ماه قبل":
				return `[[${dateToJMonthDash(
					new Date(todayTehran().setMonth(todayTehran().getMonth() - 1)),
				)}|${keyword}]]`;

			case "ماه بعد":
				return `[[${dateToJMonthDash(
					new Date(todayTehran().setMonth(todayTehran().getMonth() + 1)),
				)}|${keyword}]]`;

			case "این فصل":
				return `[[${dateToSeasonDash(todayTehran())}|${keyword}]]`;

			case "فصل قبل":
				return `[[${dateToSeasonDash(
					new Date(todayTehran().setMonth(todayTehran().getMonth() - 3)),
				)}|${keyword}]]`;

			case "فصل بعد":
				return `[[${dateToSeasonDash(
					new Date(todayTehran().setMonth(todayTehran().getMonth() + 3)),
				)}|${keyword}]]`;

			case "امسال":
				return `[[${dateToJYearDash(todayTehran())}|${keyword}]]`;

			case "سال قبل":
				return `[[${dateToJYearDash(
					new Date(todayTehran().setFullYear(todayTehran().getFullYear() - 1)),
				)}|${keyword}]]`;

			case "سال بعد":
				return `[[${dateToJYearDash(
					new Date(todayTehran().setFullYear(todayTehran().getFullYear() + 1)),
				)}|${keyword}]]`;
		}
	}

	selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent) {
		const now = todayTehran();
		const linkText = this.getFormattedDateLink(value, now); // Ensures linkText is always a string

		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			if (this.context && this.context.start && this.context.end) {
				editor.replaceRange(linkText, this.context.start, this.context.end);
			}
		}
		this.close();
	}
}
