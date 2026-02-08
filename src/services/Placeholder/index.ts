import { Notice, TFile } from "obsidian";
import PersianCalendarPlugin from "src/main";
import {
	dateToJWeekDash,
	dateToJDayDash,
	dateToJMonthDash,
	dateToSeasonDash,
	dateToJYearDash,
	dateToWeekdayName,
	dashToDate,
	dateToDaysPassedJYear,
	dateToDaysRemainingJYear,
	dashToEvents,
	eventsToString,
	jalaliMonthLength,
	checkKabiseh,
	jalaliToDate,
	dateToGregorian,
	jalaliToStartDayOfWeek,
	jalaliToEndDayOfWeek,
	dateToJalali,
} from "src/utils/dateUtils";
import type { TBuildContext, TDateFormat } from "src/types";

export default class Placeholder {
	plugin: PersianCalendarPlugin;
	private placeholderPatterns: Map<string, RegExp> = new Map();

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public async insertPersianDate(file: TFile) {
		const fileContent = await this.plugin.app.vault.read(file);
		const updatedContent = await this.processPlaceholders(file, fileContent);

		if (updatedContent !== fileContent) {
			await this.plugin.app.vault.modify(file, updatedContent);
		}
	}

	private async processPlaceholders(file: TFile, content: string): Promise<string> {
		const context = this.buildContext(file);
		if (!context) return content;

		const placeholders = this.getPlaceholderMap(context);

		let result = content;
		for (const [placeholder, value] of placeholders.entries()) {
			if (!content.includes(placeholder)) continue;

			const resolvedValue = typeof value === "function" ? await value() : value;
			if (resolvedValue != null) {
				const pattern = this.getOrCreatePattern(placeholder);
				result = result.replace(pattern, resolvedValue);
			}
		}

		return result;
	}

	private buildContext(file: TFile): TBuildContext {
		const fileName = file.basename;
		const baseDate = this.plugin.settings.dateFormat;

		let fileDate = dashToDate(fileName, baseDate);

		const isMonthly = this.isMonthlyFile(fileName);
		const isWeekly = this.isWeeklyFile(fileName);
		const isSeasonal = this.isSeasonalFile(fileName);

		return {
			currentDate: new Date(),
			fileDate,
			fileName,
			baseDate,
			isWeekly,
			isMonthly,
			isSeasonal,
			targetYear: this.extractYear(fileName, fileDate),
		};
	}

	private getPlaceholderMap({
		currentDate,
		fileName,
		fileDate,
		baseDate,
		isMonthly,
		isWeekly,
		isSeasonal,
		targetYear,
	}: TBuildContext): Map<string, unknown> {
		return new Map<string, unknown>([
			["{{امروز}}", dateToJDayDash(currentDate)],
			["{{این روز}}", fileDate ? dateToJDayDash(fileDate) : null],
			["{{روز هفته}}", dateToWeekdayName(currentDate)],
			["{{این روز هفته}}", fileDate ? dateToWeekdayName(fileDate) : null],
			["{{هفته}}", dateToJWeekDash(currentDate)],
			["{{این هفته}}", fileDate ? dateToJWeekDash(fileDate) : null],
			["{{ماه}}", dateToJMonthDash(currentDate)],
			["{{این ماه}}", fileDate ? dateToJMonthDash(fileDate) : null],
			["{{فصل}}", dateToSeasonDash(currentDate)],
			["{{این فصل}}", fileDate ? dateToSeasonDash(fileDate) : null],
			["{{سال}}", dateToJYearDash(currentDate)],
			["{{این سال}}", fileDate ? dateToJYearDash(fileDate) : null],
			["{{روزهای گذشته}}", dateToDaysPassedJYear(currentDate)],
			["{{روزهای باقیمانده}}", dateToDaysRemainingJYear(currentDate)],
			["{{اول هفته}}", isWeekly ? this.getWeekStartDate(fileName, baseDate) : null],
			["{{آخر هفته}}", isWeekly ? this.getWeekEndDate(fileName, baseDate) : null],

			// برای ماه‌‌های 11, 12 درست کار نمیکنه
			["{{اول ماه}}", isMonthly ? this.getMonthStartDate(fileName, baseDate) : null],
			["{{آخر ماه}}", isMonthly ? this.getMonthEndDate(fileName, baseDate) : null],

			["{{اول فصل}}", isSeasonal ? this.getSeasonStartDate(fileName, baseDate) : null],
			["{{آخر فصل}}", isSeasonal ? this.getSeasonEndDate(fileName, baseDate) : null],
			["{{اول سال}}", targetYear ? this.getYearStartDate(targetYear, baseDate) : null],
			["{{آخر سال}}", targetYear ? this.getYearEndDate(targetYear, baseDate) : null],
			["{{مناسبت}}", eventsToString(dashToEvents(fileName, baseDate, this.plugin.settings))],
		]);
	}

	private getOrCreatePattern(placeholder: string): RegExp {
		if (!this.placeholderPatterns.has(placeholder)) {
			const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			this.placeholderPatterns.set(placeholder, new RegExp(escaped, "g"));
		}
		return this.placeholderPatterns.get(placeholder)!;
	}

	private isWeeklyFile(title: string): boolean {
		return /^\d{4}-W\d{1,2}$/.test(title);
	}

	private isMonthlyFile(title: string): boolean {
		return /^\d{4}-\d{1,2}$/.test(title);
	}

	private isSeasonalFile(title: string): boolean {
		return /^\d{4}-S[1-4]$/.test(title);
	}

	private extractYear(fileName: string, fileDate: Date | null): number | null {
		if (fileDate) {
			const { jy } = dateToJalali(fileDate);
			return jy;
		}

		const yearMatch = fileName.match(/^(\d{4})/);
		if (!yearMatch) return null;

		return Number(yearMatch[1]);
	}

	private getWeekStartDate(title: string, dateFormat: TDateFormat): string | null {
		const match = title.match(/^(\d{4})-W(\d{1,2})$/);
		if (!match) return null;

		const year = Number(match[1]);
		const week = Number(match[2]);

		const startDay = jalaliToStartDayOfWeek({ jYear: year, jWeekNumber: week });
		const startDate = jalaliToDate(startDay.jy, startDay.jm, startDay.jd);

		return this.formatDateByBase(startDate, dateFormat);
	}

	private getWeekEndDate(title: string, dateFormat: TDateFormat): string | null {
		const match = title.match(/^(\d{4})-W(\d{1,2})$/);
		if (!match) return null;

		const year = Number(match[1]);
		const week = Number(match[2]);

		const endDay = jalaliToEndDayOfWeek({ jYear: year, jWeekNumber: week });
		const endDate = jalaliToDate(endDay.jy, endDay.jm, endDay.jd);

		return this.formatDateByBase(endDate, dateFormat);
	}

	private getMonthStartDate(title: string, dateFormat: TDateFormat) {
		const match = title.match(/^(\d{4})-(\d{1,2})$/);
		if (!match) return null;

		const year = Number(match[1]);
		const month = Number(match[2]);

		const startDate = jalaliToDate(year, month, 1);

		return this.formatDateByBase(startDate, dateFormat);
	}

	private getMonthEndDate(title: string, dateFormat: TDateFormat): string | null {
		const match = title.match(/^(\d{4})-(\d{1,2})$/);
		if (!match) return null;

		const year = parseInt(match[1]);
		const month = parseInt(match[2]);

		const jalaliEndDay = jalaliMonthLength(year, month);
		const endDate = jalaliToDate(year, month, jalaliEndDay!);

		return this.formatDateByBase(endDate, dateFormat);
	}

	private getSeasonStartDate(title: string, dateFormat: TDateFormat): string | null {
		const match = title.match(/^(\d{4})-S([1-4])$/);
		if (!match) return null;

		const year = Number(match[1]);
		const season = Number(match[2]);

		const startMonth = (season - 1) * 3 + 1;
		const startDate = jalaliToDate(year, startMonth, 1);

		return this.formatDateByBase(startDate, dateFormat);
	}

	private getSeasonEndDate(title: string, dateFormat: TDateFormat): string | null {
		const match = title.match(/^(\d{4})-S([1-4])$/);
		if (!match) return null;

		const year = Number(match[1]);
		const season = Number(match[2]);

		const endMonth = season * 3;
		const jalaliEndDay = jalaliMonthLength(year, endMonth);
		const endDate = jalaliToDate(year, endMonth, jalaliEndDay!);

		return this.formatDateByBase(endDate, dateFormat);
	}

	private getYearStartDate(year: number, dateFormat: TDateFormat): string | null {
		const startDate = jalaliToDate(year, 1, 1);
		return this.formatDateByBase(startDate, dateFormat);
	}

	private getYearEndDate(year: number, dateFormat: TDateFormat): string | null {
		const isLeap = checkKabiseh(year);
		const endDay = isLeap ? 30 : 29;
		const endDate = jalaliToDate(year, 12, endDay);

		return this.formatDateByBase(endDate, dateFormat);
	}

	private formatDateByBase(date: Date, dateFormat: TDateFormat): string {
		if (dateFormat === "gregorian") {
			const { gy, gm, gd } = dateToGregorian(date);

			return `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}`;
		}

		return dateToJDayDash(date);
	}
}
