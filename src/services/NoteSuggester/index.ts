import PersianCalendarPlugin from "src/main";
import { todayTehran } from "src/utils/dateUtils";
import {
	dateToJMonthDash,
	dateToSeasonDash,
	dateToJWeekDash,
	dateToJYearDash,
	dateToDash,
} from "src/utils/dashUtils";
import { DATE_SUGGESTER, WEEKDAYS_NAME } from "src/constants";
import type { TDateFormat, TLocal, TSuggestProvider } from "src/types";

export default class NoteSuggester {
	plugin: PersianCalendarPlugin;
	dateFormat: Omit<TDateFormat, "hijri">;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
		this.dateFormat = plugin.settings.dateFormat;
	}

	private makeLink(dash: string | null, label: string): string {
		if (dash == null) return label;
		return `[[${dash}|${label}]]`;
	}

	private dateToDashByFormat(date: Date) {
		return dateToDash(date, this.dateFormat === "gregorian" ? "gregorian" : "jalali");
	}

	private adjustedDate(base: Date, days = 0, months = 0, years = 0): Date {
		const d = new Date(base);
		if (days) d.setDate(d.getDate() + days);
		if (months) d.setMonth(d.getMonth() + months);
		if (years) d.setFullYear(d.getFullYear() + years);
		return d;
	}

	getFormattedDateLink(keyword: string, date: Date, local: TLocal = "fa"): string {
		const now = todayTehran();
		const ERROR_LINK = "تاریخ شناسایی نشد";

		const weekdaysName = WEEKDAYS_NAME[local];
		const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
		const match = keyword.match(regex);

		if (match) {
			const [, weekdayName, specifier = ""] = match;
			const weekdayEntry = Object.entries(weekdaysName).find(([, name]) => name === weekdayName);
			if (!weekdayEntry) return ERROR_LINK;

			const weekdayIndex = Number(weekdayEntry[0]);
			const todayIndex = now.getDay() === 6 ? 1 : now.getDay() + 2;
			const daysOffset = (weekdayIndex - todayIndex + 7) % 7;
			const extraWeeks = specifier.includes("بعد") ? 7 : specifier.includes("قبل") ? -7 : 0;

			now.setDate(now.getDate() + daysOffset + extraWeeks);

			const label = weekdayName + (specifier ? ` ${specifier.trim()}` : "");
			return this.makeLink(this.dateToDashByFormat(now), label);
		}

		const dayOffsets: Record<string, number> = {
			امروز: 0,
			فردا: 1,
			دیروز: -1,
			پریروز: -2,
			پس‌فردا: 2,
		};
		if (keyword in dayOffsets) {
			return this.makeLink(
				this.dateToDashByFormat(this.adjustedDate(date, dayOffsets[keyword])),
				keyword,
			);
		}

		type PeriodConfig = { fn: (d: Date) => string; days?: number; months?: number; years?: number };
		const periodMap: Record<string, PeriodConfig> = {
			"این هفته": { fn: dateToJWeekDash },
			"هفته قبل": { fn: dateToJWeekDash, days: -7 },
			"هفته بعد": { fn: dateToJWeekDash, days: 7 },
			"این ماه": { fn: dateToJMonthDash },
			"ماه قبل": { fn: dateToJMonthDash, months: -1 },
			"ماه بعد": { fn: dateToJMonthDash, months: 1 },
			"این فصل": { fn: dateToSeasonDash },
			"فصل قبل": { fn: dateToSeasonDash, months: -3 },
			"فصل بعد": { fn: dateToSeasonDash, months: 3 },
			امسال: { fn: dateToJYearDash },
			"سال قبل": { fn: dateToJYearDash, years: -1 },
			"سال بعد": { fn: dateToJYearDash, years: 1 },
		};

		const period = periodMap[keyword];
		if (period) {
			const { fn, days, months, years } = period;
			return this.makeLink(fn(this.adjustedDate(now, days, months, years)), keyword);
		}

		return ERROR_LINK;
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /@[^@\s]*$/,
			getSuggestions: (query: string) => DATE_SUGGESTER.filter((s) => s.startsWith(query)),
			onSelect: (value: string) => this.getFormattedDateLink(value, todayTehran()),
		};
	}
}
