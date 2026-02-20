import { TFile } from "obsidian";
import PersianCalendarPlugin from "src/main";
import {
	dateToWeekdayName,
	dateToDaysPassedJYear,
	dateToDaysRemainingJYear,
	dashToEvents,
	eventsToString,
	dateToMonthName,
	dateToSeasonName,
	dateToEvents,
	dateToDayOfMonth,
	dateToDaysPassedSeason,
	dateToDaysRemainingSeason,
	dateToDaysPassedJMonth,
	dateToDaysRemainingJMonth,
	todayTehran,
} from "src/utils/dateUtils";
import {
	dateToJWeekDash,
	dateToJMonthDash,
	dateToSeasonDash,
	dateToJYearDash,
	dashToDate,
	dateToDash,
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
} from "src/utils/dashUtils";
import type { TBuildContext, TDateFormat, TSuggestProvider } from "src/types";
import RTLNotice from "src/components/RTLNotice";
import { extractYearFormat } from "src/utils/formatters";

export default class Placeholder {
	plugin: PersianCalendarPlugin;
	private placeholderPatterns: Map<string, RegExp> = new Map();

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public getAllPlaceholderKeys(file?: TFile): string[] {
		const activeFile = file ?? this.plugin.app.workspace.getActiveFile();
		const context = activeFile
			? this.buildContext(activeFile)
			: { currentDate: todayTehran(), fileDate: null, fileName: "", baseDate: "" as TDateFormat };

		return Array.from(this.getPlaceholderMap(context).keys());
	}

	public async getTemplateContent(templatePath: string, targetFile: TFile): Promise<string | null> {
		if (!templatePath?.trim()) return null;

		const templateFile = this.plugin.app.vault.getAbstractFileByPath(templatePath);
		if (!templateFile || !(templateFile instanceof TFile)) return null;

		try {
			const templateContent = await this.plugin.app.vault.read(templateFile);
			return this.processPlaceholders(targetFile, templateContent);
		} catch {
			return null;
		}
	}

	public async insertPersianDate(file: TFile) {
		const fileContent = await this.plugin.app.vault.read(file);
		const updatedContent = await this.processPlaceholders(file, fileContent);

		if (updatedContent !== fileContent) {
			await this.plugin.app.vault.modify(file, updatedContent);
			RTLNotice("عبارات معنادار با موفقیت جایگزین شد.");
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

		let result = content;
		for (const [placeholder, value] of this.getPlaceholderMap(context).entries()) {
			if (!result.includes(placeholder)) continue;

			const resolvedValue = typeof value === "function" ? await value() : value;
			if (resolvedValue != null) {
				result = result.replace(this.getOrCreatePattern(placeholder), resolvedValue);
			}
		}

		return result;
	}

	private buildContext(file: TFile): TBuildContext {
		const fileName = file.basename;
		const baseDate = this.plugin.settings.dateFormat;

		return {
			currentDate: todayTehran(),
			fileDate: dashToDate(fileName, baseDate),
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
		const fromFile = <T>(fn: (d: Date) => T): T | null => (fileDate ? fn(fileDate) : null);
		const fromFileOrToday = <T>(fn: (d: Date) => T): T => fn(fileDate ?? currentDate);

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
			["{{فصل جاری}}", dateToSeasonDash(currentDate)],
			["{{مناسبت جاری}}", eventsToString(dateToEvents(currentDate, this.plugin.settings))],
			["{{سال جاری}}", dateToJYearDash(currentDate)],

			["{{روز ماه یادداشت}}", fromFile(dateToDayOfMonth)],
			["{{تاریخ شمسی یادداشت}}", fromFile((d) => dateToDash(d, "jalali"))],
			["{{تاریخ میلادی یادداشت}}", fromFile((d) => dateToDash(d, "gregorian"))],
			["{{تاریخ قمری یادداشت}}", fromFile((d) => dateToDash(d, "hijri"))],
			["{{روز هفته یادداشت}}", fromFile(dateToWeekdayName)],
			["{{سال یادداشت}}", fileDate ? dateToJYearDash(fileDate) : extractYearFormat(fileName)],
			[
				"{{مناسبت یادداشت}}",
				eventsToString(dashToEvents(fileName, baseDate, this.plugin.settings)),
			],
			["{{نام ماه یادداشت}}", dashToJMonthName(fileName, baseDate)],
			["{{ماه یادداشت}}", dashToJMonthDash(fileName, baseDate)],
			["{{نام فصل یادداشت}}", dashToSeasonName(fileName, baseDate)],
			["{{فصل یادداشت}}", dashToSeasonDash(fileName, baseDate)],
			["{{هفته یادداشت}}", dashToJWeekDash(fileName, baseDate)],

			["{{روزهای گذشته سال}}", fromFileOrToday(dateToDaysPassedJYear)],
			["{{روزهای باقیمانده سال}}", fromFileOrToday(dateToDaysRemainingJYear)],
			["{{روزهای گذشته فصل}}", fromFileOrToday(dateToDaysPassedSeason)],
			["{{روزهای باقیمانده فصل}}", fromFileOrToday(dateToDaysRemainingSeason)],
			["{{روزهای گذشته ماه}}", fromFileOrToday(dateToDaysPassedJMonth)],
			["{{روزهای باقیمانده ماه}}", fromFileOrToday(dateToDaysRemainingJMonth)],

			["{{اول سال}}", dashToStartDayOfYearDash(fileName, baseDate)],
			["{{آخر سال}}", dashToEndDayOfYearDash(fileName, baseDate)],
			["{{اول هفته}}", dashToStartDayOfWeekDash(fileName, baseDate)],
			["{{آخر هفته}}", dashToEndDayOfWeekDash(fileName, baseDate)],
			["{{اول ماه}}", dashToStartDayOfJMonthDash(fileName, baseDate)],
			["{{آخر ماه}}", dashToEndDayOfJMonthDash(fileName, baseDate)],
			["{{اول فصل}}", dashToStartDayOfSeasonDash(fileName, baseDate)],
			["{{آخر فصل}}", dashToEndDayOfSeasonDash(fileName, baseDate)],
		]);
	}

	public toProvider(): TSuggestProvider {
		return {
			trigger: /\{\{[^}]*$/,
			getSuggestions: (query: string) =>
				this.getAllPlaceholderKeys().filter((key) =>
					key.replace(/^\{\{|\}\}$/g, "").includes(query),
				),
			onSelect: (value: string) => value,
		};
	}
}
