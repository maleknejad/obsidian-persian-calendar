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
} from "src/utils/dateConverter";
import type { THolidayEvent } from "src/types";
import hijriMoment from "moment-hijri";
import { iranianHijriAdjustments, basePersianDate, baseHijriDate } from "./constants/irHijri";

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
				"{{اول سال}}": this.getFirstDayOfYear(fileName, baseDate),
				"{{آخر سال}}": this.getLastDayOfYear(fileName, baseDate),
				"{{مناسبت}}": () => this.getEvents(fileName),
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

	getFirstSaturday(year: number): { jy: number; jm: number; jd: number } {
		const firstDayGregorian = jalaali.toGregorian(year, 1, 1);
		const firstDay = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
		const firstDayWeekday = firstDay.getDay();
		const offset = firstDayWeekday === 6 ? 0 : 6 - firstDayWeekday + 1;
		const firstSaturday = new Date(firstDay.getTime());
		firstSaturday.setDate(firstSaturday.getDate() + offset);
		return jalaali.toJalaali(
			firstSaturday.getFullYear(),
			firstSaturday.getMonth() + 1,
			firstSaturday.getDate(),
		);
	}

	private isMonthlyFile(title: string): boolean {
		const monthlyPattern = /^\d{4}-\d{2}$/;
		return monthlyPattern.test(title);
	}

	private getMonthStartDate(title: string, dateFormat: string): string | null {
		const [year, month] = title.split("-").map(Number);
		if (dateFormat === "persian") {
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
		if (dateFormat === "persian") {
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

	private getFirstDayOfYear(fileBasename: string, dateFormat: string): string {
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
	private getLastDayOfYear(fileBasename: string, dateFormat: string): string {
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

	private async getEvents(title: string): Promise<string | null> {
		const date = dashToDate(title, this.plugin.settings.dateFormat);
		if (!date) return null;

		const { jy, jm, jd } = dateToJalali(date);
		const { gy, gm, gd } = dateToGregorian(date);

		const events = [];
		const settings = this.plugin.settings;

		// Persian (Jalaali) events
		if (settings.showOfficialIranianCalendar || settings.showAncientIranianCalendar) {
			const persianEvents = this.getEventsForDate(JALALI_HOLIDAYS, jm, jd);
			events.push(
				...persianEvents.filter(
					(event) =>
						(settings.showOfficialIranianCalendar && event.type === "Iran") ||
						(settings.showAncientIranianCalendar && event.type === "Ancient Iran"),
				),
			);
		}

		// Gregorian events
		events.push(...this.getEventsForDate(GLOBAL_HOLIDAYS, gm, gd));

		// Hijri events
		if (settings.showShiaCalendar) {
			const persianDate = { jy, jm, jd };

			const hijriDate = this.getHijriDate(persianDate, settings.hijriCalendarType);

			const gregorianDate = jalaali.toGregorian(persianDate.jy, persianDate.jm, persianDate.jd);
			const hijriMomentDate = hijriMoment(
				`${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`,
				"YYYY-M-D",
			);
			hijriMomentDate.iYear(hijriDate.hy);
			hijriMomentDate.iMonth(hijriDate.hm - 1); // iMonth is 0-indexed
			hijriMomentDate.iDate(hijriDate.hd);

			const hijriEvents = HIJRI_HOLIDAYS.filter(
				(event) =>
					event.month === hijriMomentDate.iMonth() + 1 && event.day === hijriMomentDate.iDate(),
			);
			events.push(...hijriEvents.filter((event) => event.type === "Islamic Iran"));
		}

		// Format events as a bulleted list
		if (events.length === 0) {
			return "هیچ رویدادی برای این روز ثبت نشده است.";
		}

		return events.map((event) => `* ${event.title}${event.holiday ? " (تعطیل)" : ""}`).join("\n");
	}

	private getEventsForDate(holidays: readonly THolidayEvent[], month: number, day: number): any[] {
		return holidays.filter((event) => event.month === month && event.day === day);
	}
	public calculateIranianHijriDate(
		baseDate: { hy: number; hm: number; hd: number },
		dayDifference: number,
	): { hy: number; hm: number; hd: number } {
		let { hy, hm, hd } = baseDate;

		while (dayDifference > 0) {
			const monthLength = iranianHijriAdjustments[hy] ? iranianHijriAdjustments[hy][hm] : null;
			if (monthLength) {
				if (hd + dayDifference <= monthLength) {
					hd += dayDifference;
					dayDifference = 0;
				} else {
					dayDifference -= monthLength - hd + 1;
					hd = 1;
					hm += 1;
					if (hm > 12) {
						hm = 1;
						hy += 1;
					}
				}
			} else {
				const gregorianDate = jalaali.toGregorian(baseDate.hy, baseDate.hm, baseDate.hd);
				const gregorianDateStr = `${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`;
				const hijriMomentDate = hijriMoment(gregorianDateStr, "YYYY-M-D").add(
					dayDifference,
					"days",
				);
				return {
					hy: hijriMomentDate.iYear(),
					hm: hijriMomentDate.iMonth() + 1,
					hd: hijriMomentDate.iDate(),
				};
			}
		}

		return { hy, hm, hd };
	}

	public getHijriDate(
		persianDate: { jy: number; jm: number; jd: number },
		hijriCalendarType: string,
	): { hy: number; hm: number; hd: number } {
		if (hijriCalendarType === "ummalqura") {
			const gregorianDate = jalaali.toGregorian(persianDate.jy, persianDate.jm, persianDate.jd);
			const gregorianDateStr = `${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`;
			const hijriMomentDate = hijriMoment(gregorianDateStr, "YYYY-M-D");
			return {
				hy: hijriMomentDate.iYear(),
				hm: hijriMomentDate.iMonth() + 1,
				hd: hijriMomentDate.iDate(),
			};
		} else {
			const dayDifference = this.calculateDayDifference(basePersianDate, persianDate);
			return this.calculateIranianHijriDate(baseHijriDate, dayDifference);
		}
	}

	public calculateDayDifference(
		fromDate: { jy: number; jm: number; jd: number },
		toDate: { jy: number; jm: number; jd: number },
	): number {
		const fromGregorian = jalaali.toGregorian(fromDate.jy, fromDate.jm, fromDate.jd);
		const toGregorian = jalaali.toGregorian(toDate.jy, toDate.jm, toDate.jd);
		const fromDateObj = new Date(fromGregorian.gy, fromGregorian.gm - 1, fromGregorian.gd);
		const toDateObj = new Date(toGregorian.gy, toGregorian.gm - 1, toGregorian.gd);
		const timeDiff = toDateObj.getTime() - fromDateObj.getTime();
		return timeDiff / (1000 * 3600 * 24);
	}
}
