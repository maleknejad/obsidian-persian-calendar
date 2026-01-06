import { TFile } from "obsidian";
import jalaali from "jalaali-js";
import PersianCalendarPlugin from "src/main";
import { JALALI_HOLIDAYS, HIJRI_HOLIDAYS, GLOBAL_HOLIDAYS } from "src/constants";
import {
	dateToJWeekDash,
	dateToJDayDash,
	dateToJMonthDash,
	dateToJQuarterDash,
	dateToJYearDash,
	dateToWeekdayName,
	dashToDate,
	dateToDaysPassedJYear,
	dateToDaysRemainingJYear,
	dateToStartDayOfWeekDash,
	dateToEndDayOfWeekDash,
	dateToJalali,
	dateToGregorian,
	jalaliToHijri,
} from "src/utils/dateConverter";
import type { THolidayEvent } from "src/types";

export default class PersianPlaceholders {
	plugin: PersianCalendarPlugin;

	constructor(plugin: PersianCalendarPlugin) {
		this.plugin = plugin;
	}

	public async insertPersianDate(file: TFile): Promise<void> {
		if (!file) {
			console.error("File object is undefined.");
			return;
		}

		const timeoutDuration = this.plugin.settings.timeoutDuration || 1250;

		setTimeout(async () => {
			const fileContent = await this.plugin.app.vault.read(file);
			let updatedContent = fileContent;

			//! base=now
			const currentDate = new Date();

			//! base=fileName
			const fileName = file.basename;
			const baseDate = this.plugin.settings.dateFormat;
			const fileDate = dashToDate(fileName, baseDate);
			if (!fileDate) return null;

			const isWeekly = this.isWeeklyFile(fileName);
			const isMonthly = this.isMonthlyFile(fileName);

			const placeholders: Record<string, any> = {
				"{{امروز}}": dateToJDayDash(currentDate),
				"{{این روز}}": dateToJDayDash(fileDate),
				"{{روز هفته}}": dateToWeekdayName(currentDate),
				"{{این روز هفته}}": dateToWeekdayName(fileDate),
				"{{هفته}}": dateToJWeekDash(currentDate),
				"{{این هفته}}": dateToJWeekDash(fileDate),
				"{{ماه}}": dateToJMonthDash(currentDate),
				"{{این ماه}}": dateToJMonthDash(fileDate),
				"{{فصل}}": dateToJQuarterDash(currentDate),
				"{{این فصل}}": dateToJQuarterDash(fileDate),
				"{{سال}}": dateToJYearDash(currentDate),
				"{{این سال}}": dateToJYearDash(fileDate),
				"{{روزهای گذشته}}": dateToDaysPassedJYear(currentDate),
				"{{روزهای باقیمانده}}": dateToDaysRemainingJYear(currentDate),
				"{{اول هفته}}": isWeekly ? dateToStartDayOfWeekDash(fileDate, { baseDate }) : null,
				"{{آخر هفته}}": isWeekly ? dateToEndDayOfWeekDash(fileDate, { baseDate }) : null,
				"{{اول ماه}}": isMonthly ? this.getMonthStartDate(fileName, baseDate) : null,
				"{{آخر ماه}}": isMonthly ? this.getMonthEndDate(fileName, baseDate) : null,
				"{{اول سال}}": this.getFirstDayOfYear(fileName),
				"{{آخر سال}}": this.getLastDayOfYear(fileName),
				"{{مناسبت}}": this.getEvents(fileName),
			};

			for (const [placeholder, value] of Object.entries(placeholders)) {
				if (fileContent.includes(placeholder)) {
					const result = typeof value === "function" ? await value() : value;
					if (result != null) {
						updatedContent = updatedContent.replace(new RegExp(placeholder, "g"), result);
					}
				}
			}

			if (updatedContent !== fileContent) {
				await this.plugin.app.vault.modify(file, updatedContent);
			}
		}, timeoutDuration);
	}

	private isWeeklyFile(title: string): boolean {
		const weeklyPattern = /^\d{4}-W\d{1,2}$/;
		return weeklyPattern.test(title);
	}

	private isMonthlyFile(title: string): boolean {
		const monthlyPattern = /^\d{4}-\d{2}$/;
		return monthlyPattern.test(title);
	}

	private getMonthStartDate(title: string, dateFormat: string): string | null {
		const [year, month] = title.split("-").map(Number);
		if (dateFormat === "jalali") {
			return `${year}-${month.toString().padStart(2, "0")}-01`;
		} else {
			const gregorianStart = jalaali.toGregorian(year, month, 1);
			return `${gregorianStart.gy}-${gregorianStart.gm
				.toString()
				.padStart(2, "0")}-${gregorianStart.gd.toString().padStart(2, "0")}`;
		}
	}

	private getMonthEndDate(title: string, dateFormat: string): string | null {
		const [year, month] = title.split("-").map(Number);
		if (dateFormat === "jalali") {
			const jalaaliEndDay = jalaali.jalaaliMonthLength(year, month);
			return `${year}-${month.toString().padStart(2, "0")}-${jalaaliEndDay
				.toString()
				.padStart(2, "0")}`;
		} else {
			const jalaaliEndDay = jalaali.jalaaliMonthLength(year, month);
			const gregorianEnd = jalaali.toGregorian(year, month, jalaaliEndDay);
			return `${gregorianEnd.gy}-${gregorianEnd.gm.toString().padStart(2, "0")}-${gregorianEnd.gd
				.toString()
				.padStart(2, "0")}`;
		}
	}

	private getFirstDayOfYear(fileBasename: string): string {
		const year = parseInt(fileBasename);
		if (isNaN(year)) {
			return "";
		}

		if (this.plugin.settings.dateFormat.toLowerCase() === "georgian") {
			const georgianDate = jalaali.toGregorian(year, 1, 1);
			return `${georgianDate.gy}-${georgianDate.gm.toString().padStart(2, "0")}-${georgianDate.gd
				.toString()
				.padStart(2, "0")}`;
		} else {
			return `${year}-01-01`;
		}
	}
	private getLastDayOfYear(fileBasename: string): string {
		const year = parseInt(fileBasename);
		if (isNaN(year)) {
			return "";
		}

		if (this.plugin.settings.dateFormat.toLowerCase() === "georgian") {
			const nextYear = jalaali.toGregorian(year + 1, 1, 1);
			const lastDay = new Date(nextYear.gy, nextYear.gm - 1, nextYear.gd - 1);
			return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(
				lastDay.getDate(),
			).padStart(2, "0")}`;
		} else {
			const isLeapYear = jalaali.isLeapJalaaliYear(year);
			return isLeapYear ? `${year}-12-30` : `${year}-12-29`;
		}
	}

	private getGregorianEvents(gm: number, gd: number): THolidayEvent[] {
		return this.filterByDate(GLOBAL_HOLIDAYS, gm, gd);
	}

	private filterByDate(
		events: readonly THolidayEvent[],
		month: number,
		day: number,
	): THolidayEvent[] {
		return events.filter((e) => e.month === month && e.day === day);
	}

	private getPersianEvents(jm: number, jd: number): THolidayEvent[] {
		const { showOfficialIranianCalendar, showAncientIranianCalendar } = this.plugin.settings;

		if (!showOfficialIranianCalendar && !showAncientIranianCalendar) return [];

		return this.filterByDate(JALALI_HOLIDAYS, jm, jd).filter(
			(event) =>
				(showOfficialIranianCalendar && event.type === "Iran") ||
				(showAncientIranianCalendar && event.type === "Ancient Iran"),
		);
	}

	private getHijriEvents(jy: number, jm: number, jd: number): THolidayEvent[] {
		if (!this.plugin.settings.showShiaCalendar) return [];

		const { hm, hd } = jalaliToHijri(jy, jm, jd);

		return HIJRI_HOLIDAYS.filter(
			(event) => event.month === hm && event.day === hd && event.type === "Islamic Iran",
		);
	}

	private async getEvents(title: string): Promise<string | null> {
		const date = dashToDate(title, this.plugin.settings.dateFormat);
		if (!date) return null;

		const { jy, jm, jd } = dateToJalali(date);
		const { gm, gd } = dateToGregorian(date);

		const events: THolidayEvent[] = [
			...this.getPersianEvents(jm, jd),
			...this.getGregorianEvents(gm, gd),
			...this.getHijriEvents(jy, jm, jd),
		];

		if (events.length === 0) {
			return "هیچ رویدادی برای این روز ثبت نشده است.";
		}

		return events.map((e) => `* ${e.title}${e.holiday ? " (تعطیل)" : ""}`).join("\n");
	}
}
