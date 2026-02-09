import { Notice, TFile } from "obsidian";
import PersianCalendarPlugin from "src/main";
import {
	dateToJWeekDash,
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
	dateToJalali,
	dateToDash,
	dateToMonthName,
	dateToSeasonName,
	dashToJWeekDash,
} from "src/utils/dateUtils";
import type { TBuildContext, TDateFormat } from "src/types";
import { isMonthlyRegex, isSeasonalRegex, isWeeklyRegex, isYearlyRegex } from "src/constants";
import { extractMonthFormat, extractSeasonFormat, extractWeekFormat } from "src/utils/formatters";
import { dashToEndDayOfWeekDash, dashToStartDayOfWeekDash } from "src/utils/dateUtils/dashUtils";

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

	private getOrCreatePattern(placeholder: string): RegExp {
		if (!this.placeholderPatterns.has(placeholder)) {
			const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			this.placeholderPatterns.set(placeholder, new RegExp(escaped, "g"));
		}
		return this.placeholderPatterns.get(placeholder)!;
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

		const isMonthly = isMonthlyRegex.test(fileName);
		const isSeasonal = isSeasonalRegex.test(fileName);

		return {
			currentDate: new Date(),
			fileDate,
			fileName,
			baseDate,
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
		isSeasonal,
		targetYear,
	}: TBuildContext): Map<string, unknown> {
		return new Map<string, unknown>([
			["{{تاریخ جاری}}", dateToDash(currentDate, "jalali")],
			["{{تاریخ یادداشت}}", fileDate ? dateToDash(fileDate, baseDate) : null],
			["{{روز هفته جاری}}", dateToWeekdayName(currentDate)],
			["{{روز هفته یادداشت}}", fileDate ? dateToWeekdayName(fileDate) : null],
			["{{هفته جاری}}", dateToJWeekDash(currentDate)],
			["{{هفته یادداشت}}", dashToJWeekDash(fileName, baseDate)],
			["{{اول هفته}}", dashToStartDayOfWeekDash(fileName, baseDate)],
			["{{آخر هفته}}", dashToEndDayOfWeekDash(fileName, baseDate)],
			["{{نام ماه جاری}}", dateToMonthName(currentDate)],
			["{{نام ماه یادداشت}}", fileDate ? dateToMonthName(fileDate) : null],
			["{{ماه جاری}}", dateToJMonthDash(currentDate)],
			["{{ماه یادداشت}}", fileDate ? dateToJMonthDash(fileDate) : null],
			["{{اول ماه}}", isMonthly ? this.getMonthStartDate(fileName, baseDate) : null],
			["{{آخر ماه}}", isMonthly ? this.getMonthEndDate(fileName, baseDate) : null],
			["{{نام فصل جاری}}", dateToSeasonName(currentDate)],
			["{{نام فصل یادداشت}}", fileDate ? dateToSeasonName(fileDate) : null],
			["{{اول فصل}}", isSeasonal ? this.getSeasonStartDate(fileName, baseDate) : null],
			["{{آخر فصل}}", isSeasonal ? this.getSeasonEndDate(fileName, baseDate) : null],
			["{{فصل جاری}}", dateToSeasonDash(currentDate)],
			["{{فصل یادداشت}}", fileDate ? dateToSeasonDash(fileDate) : null],
			["{{سال جاری}}", dateToJYearDash(currentDate)],
			["{{سال یادداشت}}", fileDate ? dateToJYearDash(fileDate) : null],
			["{{اول سال}}", targetYear ? this.getYearStartDate(targetYear, baseDate) : null],
			["{{آخر سال}}", targetYear ? this.getYearEndDate(targetYear, baseDate) : null],
			["{{روزهای گذشته}}", dateToDaysPassedJYear(currentDate)],
			["{{روزهای باقیمانده}}", dateToDaysRemainingJYear(currentDate)],
			["{{مناسبت}}", eventsToString(dashToEvents(fileName, baseDate, this.plugin.settings))],
		]);
	}

	private extractYear(fileName: string, fileDate: Date | null): number | null {
		if (fileDate) {
			const { jy } = dateToJalali(fileDate);
			return jy;
		}

		const yearMatch = fileName.match(isYearlyRegex);
		if (!yearMatch) return null;

		return Number(yearMatch[1]);
	}

	private getMonthStartDate(title: string, dateFormat: TDateFormat) {
		const monthProps = extractMonthFormat(title);
		if (!monthProps) return null;

		const startDate = jalaliToDate(monthProps.year, monthProps.month, 1);

		return dateToDash(startDate, dateFormat);
	}

	private getMonthEndDate(title: string, dateFormat: TDateFormat): string | null {
		const monthProps = extractMonthFormat(title);
		if (!monthProps) return null;

		const jalaliEndDay = jalaliMonthLength(monthProps.year, monthProps.month);
		const endDate = jalaliToDate(monthProps.year, monthProps.month, jalaliEndDay);

		return dateToDash(endDate, dateFormat);
	}

	private getSeasonStartDate(title: string, dateFormat: TDateFormat): string | null {
		const seasonProps = extractSeasonFormat(title);
		if (!seasonProps) return null;

		const startMonth = (seasonProps.season - 1) * 3 + 1;
		const startDate = jalaliToDate(seasonProps.year, startMonth, 1);

		return dateToDash(startDate, dateFormat);
	}

	private getSeasonEndDate(title: string, dateFormat: TDateFormat): string | null {
		const seasonProps = extractSeasonFormat(title);
		if (!seasonProps) return null;

		const endMonth = seasonProps.season * 3;
		const jalaliEndDay = jalaliMonthLength(seasonProps.year, endMonth);
		const endDate = jalaliToDate(seasonProps.year, endMonth, jalaliEndDay!);

		return dateToDash(endDate, dateFormat);
	}

	private getYearStartDate(year: number, dateFormat: TDateFormat): string | null {
		const startDate = jalaliToDate(year, 1, 1);
		return dateToDash(startDate, dateFormat);
	}

	private getYearEndDate(year: number, dateFormat: TDateFormat): string | null {
		const isLeap = checkKabiseh(year);
		const endDay = isLeap ? 30 : 29;
		const endDate = jalaliToDate(year, 12, endDay);

		return dateToDash(endDate, dateFormat);
	}
}
