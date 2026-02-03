import { TFile } from "obsidian";
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
	dateToStartDayOfWeekDash,
	dateToEndDayOfWeekDash,
	dashToEvents,
	eventsToString,
	jalaliToGregorian,
	jalaliMonthLength,
	checkKabiseh,
} from "src/utils/dateUtils";
import type { TBuildContext } from "src/types";

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

		// Single pass replacement with proper escaping
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
		const fileDate = dashToDate(fileName, baseDate) as Date;

		return {
			currentDate: new Date(),
			fileDate,
			fileName,
			baseDate,
			isWeekly: this.isWeeklyFile(fileName),
			isMonthly: this.isMonthlyFile(fileName),
		};
	}

	private getPlaceholderMap({
		currentDate,
		fileName,
		fileDate,
		baseDate,
		isMonthly,
		isWeekly,
	}: TBuildContext): Map<string, unknown> {
		return new Map<string, unknown>([
			["{{امروز}}", dateToJDayDash(currentDate)],
			["{{این روز}}", dateToJDayDash(fileDate)],
			["{{روز هفته}}", dateToWeekdayName(currentDate)],
			["{{این روز هفته}}", dateToWeekdayName(fileDate)],
			["{{هفته}}", dateToJWeekDash(currentDate)],
			["{{این هفته}}", dateToJWeekDash(fileDate)],
			["{{ماه}}", dateToJMonthDash(currentDate)],
			["{{این ماه}}", dateToJMonthDash(fileDate)],
			["{{فصل}}", dateToSeasonDash(currentDate)],
			["{{این فصل}}", dateToSeasonDash(fileDate)],
			["{{سال}}", dateToJYearDash(currentDate)],
			["{{این سال}}", dateToJYearDash(fileDate)],
			["{{روزهای گذشته}}", dateToDaysPassedJYear(currentDate)],
			["{{روزهای باقیمانده}}", dateToDaysRemainingJYear(currentDate)],
			["{{اول هفته}}", isWeekly ? dateToStartDayOfWeekDash(fileDate, { baseDate }) : null],
			["{{آخر هفته}}", isWeekly ? dateToEndDayOfWeekDash(fileDate, { baseDate }) : null],
			["{{اول ماه}}", isMonthly ? this.getMonthStartDate(fileName, baseDate) : null],
			["{{آخر ماه}}", isMonthly ? this.getMonthEndDate(fileName, baseDate) : null],
			["{{اول سال}}", this.getFirstDayOfYear(fileName)],
			["{{آخر سال}}", this.getLastDayOfYear(fileName)],
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

	//todo: move to utils
	private isWeeklyFile(title: string): boolean {
		return /^\d{4}-W\d{1,2}$/.test(title);
	}

	//todo: move to utils
	private isMonthlyFile(title: string): boolean {
		return /^\d{4}-\d{1,2}$/.test(title);
	}

	//todo: move to utils
	private getMonthStartDate(title: string, dateFormat: string): string | null {
		const [year, month] = title.split("-").map(Number);
		if (!year || !month) return null;

		if (dateFormat === "jalali") {
			return `${year}-${month.toString().padStart(2, "0")}-01`;
		}

		const gregorianStart = jalaliToGregorian(year, month, 1);
		return `${gregorianStart.gy}-${gregorianStart.gm
			.toString()
			.padStart(2, "0")}-${gregorianStart.gd.toString().padStart(2, "0")}`;
	}

	//todo: move to utils
	private getMonthEndDate(title: string, dateFormat: string): string | null {
		const [year, month] = title.split("-").map(Number);
		if (!year || !month) return null;

		const jalaliEndDay = jalaliMonthLength(year, month);

		if (dateFormat === "jalali") {
			return `${year}-${month.toString().padStart(2, "0")}-${jalaliEndDay
				.toString()
				.padStart(2, "0")}`;
		}

		const gregorianEnd = jalaliToGregorian(year, month, jalaliEndDay);
		return `${gregorianEnd.gy}-${gregorianEnd.gm.toString().padStart(2, "0")}-${gregorianEnd.gd
			.toString()
			.padStart(2, "0")}`;
	}

	//todo: move to utils
	private getFirstDayOfYear(fileBasename: string): string {
		const year = parseInt(fileBasename);
		if (isNaN(year)) return "";

		if (this.plugin.settings.dateFormat === "gregorian") {
			const georgianDate = jalaliToGregorian(year, 1, 1);
			return `${georgianDate.gy}-${georgianDate.gm.toString().padStart(2, "0")}-${georgianDate.gd
				.toString()
				.padStart(2, "0")}`;
		}

		return `${year}-01-01`;
	}

	//todo: move to utils
	private getLastDayOfYear(fileBasename: string): string {
		const year = parseInt(fileBasename);
		if (isNaN(year)) return "";

		if (this.plugin.settings.dateFormat === "gregorian") {
			const nextYear = jalaliToGregorian(year + 1, 1, 1);
			const lastDay = new Date(nextYear.gy, nextYear.gm - 1, nextYear.gd - 1);
			return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(
				lastDay.getDate(),
			).padStart(2, "0")}`;
		}

		const isLeapYear = checkKabiseh(year);
		return isLeapYear ? `${year}-12-30` : `${year}-12-29`;
	}
}
