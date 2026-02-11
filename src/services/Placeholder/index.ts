import { TFile } from "obsidian";
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
	dateToDash,
	dateToMonthName,
	dateToSeasonName,
	dashToJWeekDash,
	dashToJMonthName,
	dashToEndDayOfWeekDash,
	dashToJMonthDash,
	dashToStartDayOfWeekDash,
	dashToStartDayOfJMonthDash,
	dashToEndDayOfJMonthDash,
	dashToSeasonName,
	dashToSeasonDash,
	dashToStartDayOfSeasonDash,
	dashToEndDayOfSeasonDash,
	dashToEndDayOfYearDash,
	dashToStartDayOfYearDash,
	dateToEvents,
	dateToDayOfMonth,
} from "src/utils/dateUtils";
import type { TBuildContext } from "src/types";
import { extractYearFormat } from "src/utils/formatters";

export default class Placeholder {
	plugin: PersianCalendarPlugin;
	private placeholderPatterns: Map<string, RegExp> = new Map();

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public async getTemplateContent(templatePath: string, targetFile: TFile): Promise<string | null> {
		if (!templatePath || templatePath.trim() === "") {
			return null;
		}

		const templateFile = this.plugin.app.vault.getAbstractFileByPath(templatePath);

		if (!templateFile || !(templateFile instanceof TFile)) {
			return null;
		}

		try {
			const templateContent = await this.plugin.app.vault.read(templateFile);
			const processedContent = await this.processPlaceholders(targetFile, templateContent);
			return processedContent;
		} catch (error) {
			return null;
		}
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

		return {
			currentDate: new Date(),
			fileDate,
			fileName,
			baseDate,
		};
	}

	private getPlaceholderMap({
		currentDate,
		fileName,
		fileDate,
		baseDate,
	}: TBuildContext): Map<string, unknown> {
		return new Map<string, unknown>([
			["{{تاریخ شمسی جاری}}", dateToDash(currentDate, "jalali")],
			["{{تاریخ میلادی جاری}}", dateToDash(currentDate, "gregorian")],
			["{{تاریخ قمری جاری}}", dateToDash(currentDate, "hijri")],
			["{{روز هفته جاری}}", dateToWeekdayName(currentDate)],
			["{{هفته جاری}}", dateToJWeekDash(currentDate)],
			["{{نام ماه جاری}}", dateToMonthName(currentDate)],
			["{{ماه جاری}}", dateToJMonthDash(currentDate)],
			["{{نام فصل جاری}}", dateToSeasonName(currentDate)],

			["{{روز ماه جاری}}", dateToDayOfMonth(currentDate)],
			["{{روز ماه یادداشت}}", fileDate ? dateToDayOfMonth(fileDate) : null],

			["{{فصل جاری}}", dateToSeasonDash(currentDate)],
			["{{سال جاری}}", dateToJYearDash(currentDate)],
			["{{روزهای گذشته}}", dateToDaysPassedJYear(currentDate)],
			["{{مناسبت جاری}}", eventsToString(dateToEvents(currentDate, this.plugin.settings))],
			["{{روزهای باقیمانده}}", dateToDaysRemainingJYear(currentDate)],
			["{{تاریخ شمسی یادداشت}}", fileDate ? dateToDash(fileDate, "jalali") : null],
			["{{تاریخ میلادی یادداشت}}", fileDate ? dateToDash(fileDate, "gregorian") : null],
			["{{تاریخ قمری یادداشت}}", fileDate ? dateToDash(fileDate, "hijri") : null],
			["{{روز هفته یادداشت}}", fileDate ? dateToWeekdayName(fileDate) : null],
			["{{اول سال}}", dashToStartDayOfYearDash(fileName, baseDate)],
			["{{آخر سال}}", dashToEndDayOfYearDash(fileName, baseDate)],
			["{{سال یادداشت}}", extractYearFormat(fileName)],
			["{{هفته یادداشت}}", dashToJWeekDash(fileName, baseDate)],
			["{{اول هفته}}", dashToStartDayOfWeekDash(fileName, baseDate)],
			["{{آخر هفته}}", dashToEndDayOfWeekDash(fileName, baseDate)],
			[
				"{{مناسبت یادداشت}}",
				eventsToString(dashToEvents(fileName, baseDate, this.plugin.settings)),
			],
			["{{نام ماه یادداشت}}", dashToJMonthName(fileName, baseDate)],
			["{{ماه یادداشت}}", dashToJMonthDash(fileName, baseDate)],
			["{{اول ماه}}", dashToStartDayOfJMonthDash(fileName, baseDate)],
			["{{آخر ماه}}", dashToEndDayOfJMonthDash(fileName, baseDate)],
			["{{نام فصل یادداشت}}", dashToSeasonName(fileName, baseDate)],
			["{{فصل یادداشت}}", dashToSeasonDash(fileName, baseDate)],
			["{{اول فصل}}", dashToStartDayOfSeasonDash(fileName, baseDate)],
			["{{آخر فصل}}", dashToEndDayOfSeasonDash(fileName, baseDate)],
		]);
	}
}
