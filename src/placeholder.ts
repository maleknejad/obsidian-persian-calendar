import { TFile } from "obsidian";
import jalaali from "jalaali-js";
import PersianCalendarPlugin from "src/main";
import { JALALI_HOLIDAYS, HIJRI_HOLIDAYS, GLOBAL_HOLIDAYS } from "src/constants";
import {
	dateToJWeekDash,
	dateToJalaliDash,
	dateToJMonthDash,
	dateToJQuarterDash,
	dateToJYearDash,
	dateToWeekdayName,
} from "src/utils/dateConverter";
import type { THolidayEvent } from "src/types";
import moment from "moment-jalaali";
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

			const basename = file.basename;
			const dateFormat = this.plugin.settings.dateFormat;
			const isWeekly = this.isWeeklyFile(basename);
			const isMonthly = this.isMonthlyFile(basename);

			const currentDate = new Date();
			const currentJalali = dateToJalaliDash(currentDate);
			const currentWeek = dateToJWeekDash(currentDate);
			const currentMonth = dateToJMonthDash(currentDate);
			const currentQuarter = dateToJQuarterDash(currentDate);
			const currentYear = dateToJYearDash(currentDate);
			const currentWeekName = dateToWeekdayName(currentDate);

			const [year, week] = basename.split("-W").map(Number);

			const placeholders: Record<string, any> = {
				"{{امروز}}": currentJalali,
				"{{این روز}}": this.getFormattedDateFromFileTitle(basename, dateFormat),
				"{{روز هفته}}": currentWeekName,
				"{{این روز هفته}}": this.getWeekdayFromFileTitle(basename, dateFormat),
				"{{هفته}}": currentWeek,
				"{{این هفته}}": this.getWeekNumberFromFileTitle(basename, dateFormat),
				"{{ماه}}": currentMonth,
				"{{این ماه}}": this.getMonthNumberFromFileTitle(basename, dateFormat),
				"{{فصل}}": currentQuarter,
				"{{این فصل}}": this.getQuarterNumberFromFileTitle(basename, dateFormat),
				"{{سال}}": currentYear,
				"{{این سال}}": this.getYearNumberFromFileTitle(basename, dateFormat),
				"{{روزهای گذشته}}": this.getDaysPassedFromFileTitle(basename, dateFormat),
				"{{روزهای باقیمانده}}": this.getDaysUntilEndOfYear(basename, dateFormat),
				"{{اول هفته}}": isWeekly ? this.getWeekStartDate(year, week, dateFormat) : null,
				"{{آخر هفته}}": isWeekly ? this.getWeekEndDate(year, week, dateFormat) : null,
				"{{اول ماه}}": isMonthly ? this.getMonthStartDate(basename, dateFormat) : null,
				"{{آخر ماه}}": isMonthly ? this.getMonthEndDate(basename, dateFormat) : null,
				"{{اول سال}}": this.getFirstDayOfYear(basename, dateFormat),
				"{{آخر سال}}": this.getLastDayOfYear(basename, dateFormat),
				"{{مناسبت}}": () => this.getEvents(basename),
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

	private parseDateFromTitle(title: string, dateFormat: any): moment.Moment | null {
		let parsedDate: moment.Moment;

		if (dateFormat === "persian") {
			// Parse Persian date
			parsedDate = moment(title, "jYYYY-jMM-jDD");
		} else {
			// Parse Gregorian date and convert to Jalaali
			parsedDate = moment(title, "YYYY-MM-DD");
			if (parsedDate.isValid()) {
				// convert to Jalaali
				const jalaaliStr = parsedDate.format("jYYYY-jMM-jDD");
				parsedDate = moment(jalaaliStr, "jYYYY-jMM-jDD");
			}
		}

		return parsedDate.isValid() ? parsedDate : null;
	}

	private getFormattedDateFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			return parsedDate.format("jYYYY-jMM-jDD");
		}
		return null;
	}

	private getWeekdayFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			return parsedDate.format("dddd");
		}
		return null;
	}

	private getWeekNumberFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			const jWeek = parsedDate.jWeek();
			const jYear = parsedDate.jYear();
			return `${jYear}-W${jWeek}`;
		}
		return null;
	}

	private getMonthNumberFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			const jMonth = parsedDate.jMonth() + 1;
			const jYear = parsedDate.jYear();
			return `${jYear}-${jMonth}`;
		}
		return null;
	}

	private getYearNumberFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			return `${parsedDate.jYear()}`;
		}
		return null;
	}

	private getQuarterNumberFromFileTitle(title: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(title, dateFormat);
		if (parsedDate) {
			const jMonth = parsedDate.jMonth() + 1;
			const quarter = Math.ceil(jMonth / 3);
			const jYear = parsedDate.jYear();
			return `${jYear}-Q${quarter}`;
		}
		return null;
	}

	private getDaysPassedFromFileTitle(title: string, dateFormat: string): string | null {
		try {
			let parsedDate;
			if (dateFormat === "georgian") {
				parsedDate = moment(title, "YYYY-MM-DD");
				if (parsedDate.isValid()) {
					parsedDate = parsedDate.locale("fa");
				}
			} else {
				parsedDate = moment(title, "jYYYY/jMM/jDD");
			}

			if (!parsedDate.isValid()) {
				console.error("Invalid date in file title");
				return null;
			}

			const startOfYear = moment(`${parsedDate.jYear()}/1/1`, "jYYYY/jM/jD").locale("fa");
			const daysPassed = parsedDate.diff(startOfYear, "days") + 1;
			return daysPassed.toString();
		} catch (error) {
			console.error("Error calculating days passed: ", error);
			return null;
		}
	}

	private getDaysUntilEndOfYear(dateStr: string, dateFormat: string): string | null {
		const parsedDate = this.parseDateFromTitle(dateStr, dateFormat);
		if (parsedDate) {
			const endOfYear = moment(`${parsedDate.jYear()}/12/29`, "jYYYY/jMM/jDD").locale("fa");
			const daysUntilEnd = endOfYear.diff(parsedDate, "days");
			return daysUntilEnd.toString();
		}
		return null;
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

	getWeekStartDate(year: number, week: number, dateFormat: string): string {
		try {
			const firstDayOfYearGregorian = jalaali.toGregorian(year, 1, 1);
			const firstDayOfYear = new Date(
				firstDayOfYearGregorian.gy,
				firstDayOfYearGregorian.gm - 1,
				firstDayOfYearGregorian.gd,
			);
			const firstDayWeekday = firstDayOfYear.getDay();
			const adjustedWeek = firstDayWeekday === 6 ? week : week - 1;

			const firstSaturday = this.getFirstSaturday(year);
			const startDate = jalaali.toGregorian(firstSaturday.jy, firstSaturday.jm, firstSaturday.jd);
			const start = new Date(startDate.gy, startDate.gm - 1, startDate.gd);
			start.setDate(start.getDate() + (adjustedWeek - 1) * 7);

			while (start.getDay() !== 6) {
				start.setDate(start.getDate() - 1);
			}
			const weekStartJalaali = jalaali.toJalaali(
				start.getFullYear(),
				start.getMonth() + 1,
				start.getDate(),
			);
			return this.formatDate(weekStartJalaali, dateFormat);
		} catch (error) {
			console.error("Error in getWeekStartDate:", error);
			throw error;
		}
	}

	getWeekEndDate(year: number, week: number, dateFormat: string): string {
		try {
			const weekStart = this.getWeekStartDate(year, week, "persian");
			const [jy, jm, jd] = weekStart.split("-").map(Number);
			const startDateGregorian = jalaali.toGregorian(jy, jm, jd);
			const startDate = new Date(
				startDateGregorian.gy,
				startDateGregorian.gm - 1,
				startDateGregorian.gd,
			);
			startDate.setDate(startDate.getDate() + 6);
			const weekEndJalaali = jalaali.toJalaali(
				startDate.getFullYear(),
				startDate.getMonth() + 1,
				startDate.getDate(),
			);
			return this.formatDate(weekEndJalaali, dateFormat);
		} catch (error) {
			console.error("Error in getWeekEndDate:", error);
			throw error;
		}
	}

	formatDate(date: { jy: number; jm: number; jd: number }, dateFormat: string): string {
		if (dateFormat === "persian") {
			return `${date.jy}-${date.jm.toString().padStart(2, "0")}-${date.jd
				.toString()
				.padStart(2, "0")}`;
		} else {
			const gregorian = jalaali.toGregorian(date.jy, date.jm, date.jd);
			return `${gregorian.gy}-${gregorian.gm.toString().padStart(2, "0")}-${gregorian.gd
				.toString()
				.padStart(2, "0")}`;
		}
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

	private async getEvents(title: string): Promise<string> {
		const date = this.parseDateFromTitle(title, this.plugin.settings.dateFormat);
		if (!date) {
			return "تاریخ نامعتبر";
		}

		const events = [];
		const settings = this.plugin.settings;

		// Persian (Jalaali) events
		if (settings.showOfficialIranianCalendar || settings.showAncientIranianCalendar) {
			const persianEvents = this.getEventsForDate(JALALI_HOLIDAYS, date.jMonth() + 1, date.jDate());
			events.push(
				...persianEvents.filter(
					(event) =>
						(settings.showOfficialIranianCalendar && event.type === "Iran") ||
						(settings.showAncientIranianCalendar && event.type === "Ancient Iran"),
				),
			);
		}

		// Gregorian events
		events.push(...this.getEventsForDate(GLOBAL_HOLIDAYS, date.month() + 1, date.date()));

		// Hijri events
		if (settings.showShiaCalendar) {
			const persianDate = { jy: date.jYear(), jm: date.jMonth() + 1, jd: date.jDate() };

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
