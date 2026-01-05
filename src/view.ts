import { WorkspaceLeaf, Notice, App, View, TFile, MarkdownView } from "obsidian";
import { getJalaliNow } from "src/utils/dateConverter";
import { toJalaali, jalaaliMonthLength, toGregorian } from "jalaali-js";
import * as jalaali from "jalaali-js";
import type { PluginSettings, JalaaliDate, HolidayEvent } from "./settings";
import moment from "moment-jalaali";
import hijriMoment from "moment-hijri";
import PersianCalendarPlugin from "./main";
import {
	PersianCalendarHolidays,
	HijriCalendarHolidays,
	GregorianCalendarHolidays,
} from "./constants/holidays";
import { iranianHijriAdjustments, basePersianDate, baseHijriDate } from "./hijri";

export default class PersianCalendarView extends View {
	dailyCheckInterval: number | undefined;
	lastCheckedDate: moment.Moment = moment().startOf("day");
	noteDays: number[] = [];
	plugin: PersianCalendarPlugin;

	constructor(
		leaf: WorkspaceLeaf,
		app: App,
		settings: PluginSettings,
		plugin: PersianCalendarPlugin,
	) {
		super(leaf);
		this.app = app;
		this.settings = settings;
		this.currentJalaaliYear = 0;
		this.currentJalaaliMonth = 0;
		this.loadCurrentMonth();
		const todayJalaali = toJalaali(new Date());
		this.currentJalaaliYear = todayJalaali.jy;
		this.currentJalaaliMonth = todayJalaali.jm;
		this.startDailyCheckInterval();
		this.noteDays = [];
		this.plugin = plugin;
	}

	private holidayData: { [key: string]: HolidayEvent[] } = {
		PersianCalendar: PersianCalendarHolidays,
		HijriCalendar: HijriCalendarHolidays,
		GregorianCalendar: GregorianCalendarHolidays,
	};

	async initializeHolidayData() {
		console.log("Holiday data initialized:", this.holidayData);
	}

	getViewType(): string {
		return "persian-calendar";
	}

	getDisplayText(): string {
		return "Persian Calendar";
	}

	async onOpen(): Promise<void> {
		this.initializeHolidayData().then(() => {
			this.render();
			this.startDailyCheckInterval();
		});
	}

	async onClose(): Promise<void> {
		this.stopDailyCheckInterval();
	}

	getIcon() {
		return "calendar";
	}

	focus() {
		const inputEl = this.containerEl.querySelector("input");
		inputEl?.focus();
	}
	private currentJalaaliYear: number;
	private currentJalaaliMonth: number;

	private settings: PluginSettings;

	public async render() {
		const containerEl = this.containerEl;
		containerEl.empty();

		await this.renderHeader(containerEl);
		const contentEl = containerEl.createEl("div", { cls: "calendar-content" });
		await this.renderWeekNumbers(contentEl, this.getCurrentJalaaliDate());
		await this.renderDaysGrid(contentEl, this.getCurrentJalaaliDate());
		if (this.settings.enableQuarterlyNotes) {
			await this.renderQuarterlyNotesRow(contentEl);
		}
	}

	private async renderHeader(containerEl: HTMLElement): Promise<void> {
		const headerEl = containerEl.createEl("div", { cls: "calendar-header" });

		const navContainerEl = headerEl.createEl("div", { cls: "calendar-navigation" });

		const prevMonthArrow = navContainerEl.createEl("span", { cls: "calendar-change-month-arrow" });
		prevMonthArrow.textContent = "<";
		prevMonthArrow.addEventListener("click", () => this.changeMonth(1));

		const todayButton = navContainerEl.createEl("span", { cls: "calendar-today-button" });
		todayButton.textContent = "امروز";
		todayButton.addEventListener("click", () => this.goToToday());

		const nextMonthArrow = navContainerEl.createEl("span", { cls: "calendar-change-month-arrow" });
		nextMonthArrow.textContent = ">";
		nextMonthArrow.addEventListener("click", () => this.changeMonth(-1));

		const monthYearEl = headerEl.createEl("div", { cls: "calendar-month-year" });
		const monthEl = monthYearEl.createEl("span", { cls: "calendar-month" });
		const yearEl = monthYearEl.createEl("span", { cls: "calendar-year" });
		const georgianMonthYearEl = monthYearEl.createEl("div", {
			cls: "calendar-georgian-month-year",
		});
		const hijriMonthYearEl = monthYearEl.createEl("div", { cls: "calendar-hijri-month-year" });

		const monthName = this.getMonthName(this.currentJalaaliMonth);
		monthEl.textContent = monthName;
		yearEl.textContent = this.toFarsiDigits(this.currentJalaaliYear);

		if (this.settings.showGeorgianDates) {
			const georgianMonthRange = this.getGeorgianMonthRange(
				this.currentJalaaliYear,
				this.currentJalaaliMonth,
			);
			georgianMonthYearEl.textContent = georgianMonthRange;
		}

		if (this.settings.showHijriDates) {
			const hijriMonthRange = this.getHijriMonthRange(
				this.currentJalaaliYear,
				this.currentJalaaliMonth,
			);
			hijriMonthYearEl.textContent = hijriMonthRange;
		}

		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.openOrCreateMonthlyNote(this.currentJalaaliMonth, this.currentJalaaliYear);
		});

		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.openOrCreateYearlyNote(this.currentJalaaliYear);
		});
	}

	private getGeorgianMonthRange(jy: number, jm: number): string {
		const firstDayOfMonthGeorgian = jalaali.toGregorian(jy, jm, 1);
		const lastDayOfMonthJalaali = jalaali.jalaaliMonthLength(jy, jm);
		const lastDayOfMonthGeorgian = jalaali.toGregorian(jy, jm, lastDayOfMonthJalaali);

		const startMonthName = this.getGeorgianMonthName(firstDayOfMonthGeorgian.gm);
		const endMonthName = this.getGeorgianMonthName(lastDayOfMonthGeorgian.gm);

		if (firstDayOfMonthGeorgian.gm === lastDayOfMonthGeorgian.gm) {
			return `${startMonthName} ${firstDayOfMonthGeorgian.gy}`;
		} else {
			return `${startMonthName}-${endMonthName} ${lastDayOfMonthGeorgian.gy}`;
		}
	}

	private getHijriMonthRange(jy: number, jm: number): string {
		const firstDayOfMonthGeorgian = jalaali.toGregorian(jy, jm, 1);
		const lastDayOfMonthJalaali = jalaali.jalaaliMonthLength(jy, jm);
		const lastDayOfMonthGeorgian = jalaali.toGregorian(jy, jm, lastDayOfMonthJalaali);

		const startHijriDate = hijriMoment(
			`${firstDayOfMonthGeorgian.gy}-${firstDayOfMonthGeorgian.gm}-${firstDayOfMonthGeorgian.gd}`,
			"YYYY-M-D",
		);
		const endHijriDate = hijriMoment(
			`${lastDayOfMonthGeorgian.gy}-${lastDayOfMonthGeorgian.gm}-${lastDayOfMonthGeorgian.gd}`,
			"YYYY-M-D",
		);

		const startHijriMonth = this.getHijriMonthName(startHijriDate.iMonth() + 1);
		const startHijriYear = this.toFarsiDigits(startHijriDate.iYear());
		const endHijriMonth = this.getHijriMonthName(endHijriDate.iMonth() + 1);
		const endHijriYear = this.toFarsiDigits(endHijriDate.iYear());

		if (startHijriDate.iMonth() === endHijriDate.iMonth()) {
			return `${startHijriMonth} ${startHijriYear}`;
		} else {
			return `${startHijriMonth}-${endHijriMonth} ${endHijriYear}`;
		}
	}

	private getGeorgianMonthName(month: number): string {
		const georgianMonthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		return georgianMonthNames[month - 1];
	}

	private getHijriMonthName(month: number): string {
		const hijriMonthNames = [
			"محرم",
			"صفر",
			"ربيع۱",
			"ربيع۲",
			"جما۱",
			"جما۲",
			"رجب",
			"شعبان",
			"رمضان",
			"شوال",
			"ذو.ق",
			"ذو.ح",
		];
		return hijriMonthNames[month - 1];
	}

	private async renderWeekNumbers(contentEl: HTMLElement, jalaaliDate: { jy: number; jm: number }) {
		let weekNumbersEl = contentEl.querySelector(".calendar-week-numbers");
		if (weekNumbersEl) {
			weekNumbersEl.remove();
		}

		weekNumbersEl = contentEl.createEl("div", { cls: "calendar-week-numbers" });
		const weekHeader = weekNumbersEl.createEl("div", { cls: "calendar-week-header" });
		weekHeader.textContent = "ه";

		const weekNumbers = this.getWeekNumbersForMonth(jalaaliDate);
		const weeksWithNotes = await this.getWeeksWithNotes(jalaaliDate.jy);

		for (let i = 0; i < 6; i++) {
			const weekEl = weekNumbersEl.createEl("div", { cls: "calendar-week-number" });

			if (i < weekNumbers.length) {
				weekEl.textContent = this.toFarsiDigits(weekNumbers[i]);

				if (!weeksWithNotes.includes(weekNumbers[i])) {
					weekEl.addClass("no-notes");
				}

				weekEl.addEventListener("click", async () => {
					await this.openOrCreateWeeklyNote(weekNumbers[i], jalaaliDate.jy);
				});
			} else {
				weekEl.textContent = "";
			}
		}
	}

	private async renderDaysGrid(contentEl: HTMLElement, jalaaliDate: { jy: number; jm: number }) {
		let gridEl = contentEl.querySelector(".calendar-days-grid");
		if (gridEl) {
			gridEl.remove();
		}
		gridEl = contentEl.createEl("div", { cls: "calendar-days-grid" });

		const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
		weekdays.forEach((weekday, index) => {
			if (!gridEl) {
				new Notice(
					"Calendar grid element not found. Please ensure the calendar is properly loaded.",
				);
				return;
			}
			const headerCell = gridEl.createEl("div", { cls: "calendar-weekday-header" });
			headerCell.textContent = weekday;
			headerCell.classList.add("dynamic-grid-placement");
			headerCell.style.setProperty("--dynamic-grid-start", (index + 2).toString());
		});

		const daysWithNotes = await this.getDaysWithNotes();
		const daysInMonth = jalaali.jalaaliMonthLength(jalaaliDate.jy, jalaaliDate.jm);
		const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jalaaliDate.jy, jalaaliDate.jm);
		const totalCells = 42;
		const daysFromPrevMonth = this.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
		const daysFromNextMonth = this.calculateDaysFromNextMonth(firstDayOfWeekIndex, daysInMonth);

		for (let i = 0; i < totalCells; i++) {
			const dayEl = gridEl.createEl("div", { cls: "calendar-day" });
			const dayIndex = i - firstDayOfWeekIndex;
			let dayNumber = dayIndex + 1;
			let isHoliday = false;
			let isWeekend = false;

			if (dayIndex < 0) {
				dayNumber = daysFromPrevMonth[daysFromPrevMonth.length + dayIndex];
				dayEl.createEl("div", { cls: "persian-date" }).textContent = this.toFarsiDigits(dayNumber);
				dayEl.addClass("dim");
			} else if (dayIndex < daysInMonth) {
				const persianDateEl = dayEl.createEl("div", { cls: "persian-date" });
				persianDateEl.textContent = this.toFarsiDigits(dayNumber);
				if (this.isToday({ jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber })) {
					dayEl.addClass("today");
				}
				if (!daysWithNotes.includes(dayNumber)) {
					dayEl.addClass("no-notes");
				}
				dayEl.addEventListener("click", () => {
					this.openOrCreateDailyNote(dayNumber);
				});

				const persianDate = { jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber };
				const ummalquraAdjustment = this.plugin.settings.hijriDateAdjustment;
				const hijriDateResult = this.getHijriDate(
					persianDate,
					this.plugin.settings.hijriCalendarType,
					ummalquraAdjustment,
				);

				const hijriDate = hijriDateResult.hd.toString();
				const hijriMonth = hijriDateResult.hm;
				// Check Persian holidays
				if (
					this.plugin.settings.showHolidays &&
					this.isHoliday("PersianCalendar", jalaaliDate.jm, dayNumber)
				) {
					isHoliday = true;
				}
				if (
					this.plugin.settings.showHolidays &&
					this.isHoliday("HijriCalendar", hijriMonth, parseInt(hijriDate))
				) {
					isHoliday = true;
				}

				// Add hover event listener to show events tooltip
				dayEl.addEventListener("mouseenter", (e) => {
					const events = this.getEventsForDate(jalaaliDate.jy, jalaaliDate.jm, dayNumber);
					if (events.length > 0) {
						this.showTooltip(e, dayEl, events);
					}
				});

				dayEl.addEventListener("mouseleave", () => {
					this.hideTooltip();
				});

				dayEl.addEventListener("touchstart", (e) => {
					const events = this.getEventsForDate(jalaaliDate.jy, jalaaliDate.jm, dayNumber);
					if (events.length > 0) {
						this.showTooltip(e, dayEl, events);
					}
				});

				dayEl.addEventListener("touchend", () => {
					this.hideTooltip();
				});
			} else {
				dayNumber = daysFromNextMonth[dayIndex - daysInMonth];
				dayEl.createEl("div", { cls: "persian-date" }).textContent = this.toFarsiDigits(dayNumber);
				dayEl.addClass("dim");
			}

			if (dayIndex >= 0 && dayIndex < daysInMonth) {
				const showBothCalendars =
					this.plugin.settings.showGeorgianDates && this.plugin.settings.showHijriDates;
				if (this.plugin.settings.showGeorgianDates) {
					const georgianDate = jalaali.toGregorian(jalaaliDate.jy, jalaaliDate.jm, dayNumber);
					const georgianDateEl = dayEl.createEl("div", {
						cls: showBothCalendars ? "georgian-date-corner" : "georgian-date",
					});

					const persianDate = { jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber };
					const ummalquraAdjustment = this.plugin.settings.hijriDateAdjustment;
					const hijriDateResult = this.getHijriDate(
						persianDate,
						this.plugin.settings.hijriCalendarType,
						ummalquraAdjustment,
					);

					const hijriDate = hijriDateResult.hd.toString();
					const hijriMonth = hijriDateResult.hm;

					georgianDateEl.textContent = georgianDate.gd.toString();

					// Check Georgian holidays
					if (
						this.plugin.settings.showHolidays &&
						this.isHoliday("GregorianCalendar", georgianDate.gm, georgianDate.gd)
					) {
						isHoliday = true;
					}
					if (this.isToday({ jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber })) {
						dayEl.addClass("today");
					}
					if (
						this.plugin.settings.showHolidays &&
						this.isHoliday("HijriCalendar", hijriMonth, parseInt(hijriDate))
					) {
						isHoliday = true;
					}
				}

				if (this.plugin.settings.showHijriDates) {
					const persianDate = { jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber };
					const ummalquraAdjustment = this.plugin.settings.hijriDateAdjustment;

					const hijriDateResult = this.getHijriDate(
						persianDate,
						this.plugin.settings.hijriCalendarType,
						ummalquraAdjustment,
					);

					const hijriDate = hijriDateResult.hd.toString();
					const hijriMonth = hijriDateResult.hm;

					const hijriDateEl = dayEl.createEl("div", {
						cls: showBothCalendars ? "hijri-date-corner" : "hijri-date",
					});
					hijriDateEl.textContent = this.toFarsiDigits(hijriDate);

					// Check Hijri holidays
					if (
						this.plugin.settings.showHolidays &&
						this.isHoliday("HijriCalendar", hijriMonth, parseInt(hijriDate))
					) {
						isHoliday = true;
					}
					if (this.isToday({ jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber })) {
						dayEl.addClass("today");
					}
				}

				// Check if the current day is a weekend based on user settings
				const dayOfWeek = (firstDayOfWeekIndex + dayIndex) % 7; // 0: Saturday, 1: Sunday, ..., 6: Friday
				if (
					(this.plugin.settings.weekendDays === "thursday-friday" &&
						(dayOfWeek === 5 || dayOfWeek === 6)) ||
					(this.plugin.settings.weekendDays === "friday" && dayOfWeek === 6) ||
					(this.plugin.settings.weekendDays === "friday-saturday" &&
						(dayOfWeek === 6 || dayOfWeek === 0))
				) {
					isWeekend = true;
				}

				if (isHoliday || isWeekend) {
					dayEl.addClass("holiday");
					// Apply holiday class to all child elements
					dayEl.querySelectorAll(".persian-date, .georgian-date, .hijri-date").forEach((el) => {
						el.classList.add("holiday");
					});
				}
			}

			dayEl.classList.add("dynamic-day-grid-placement");
			dayEl.style.setProperty("--day-grid-start", ((i % 7) + 2).toString());
		}
	}

	// Helper function to check if a date is a holiday
	private isHoliday(calendarType: string, month: number, day: number): boolean {
		if (!this.holidayData[calendarType]) {
			return false;
		}

		return this.holidayData[calendarType].some(
			(holiday: { month: number; day: number; holiday: boolean }) => {
				return holiday.month === month && holiday.day === day && holiday.holiday;
			},
		);
	}
	private async renderQuarterlyNotesRow(containerEl: HTMLElement) {
		const quartersRow = containerEl.createDiv({ cls: "calendar-quarters-row" });
		const { quarter: currentQuarter, jy } = this.getCurrentQuarter();
		const seasons = ["بهار", "تابستان", "پاییز", "زمستان"];
		seasons.forEach((season, index) => {
			const quarterDiv = quartersRow.createDiv({
				cls: `calendar-quarter${index + 1 === currentQuarter ? " current-quarter" : ""}`,
			});
			quarterDiv.textContent = season;
			quarterDiv.addEventListener("click", () => {
				const quarterNumber = index + 1;
				this.openOrCreateQuarterlyNote(quarterNumber, jy);
			});
		});
	}

	private startDailyCheckInterval(): void {
		this.dailyCheckInterval = setInterval(() => {
			const today = moment().startOf("day");
			if (!this.lastCheckedDate.isSame(today, "day")) {
				this.lastCheckedDate = today;
				this.render();
			}
		}, 60 * 1000) as unknown as number;
	}

	private stopDailyCheckInterval(): void {
		if (this.dailyCheckInterval !== undefined) {
			clearInterval(this.dailyCheckInterval);
			this.dailyCheckInterval = undefined;
		}
	}

	private isToday(jalaaliDate: { jy: number; jm: number; jd: number }): boolean {
		const today = moment().locale("fa");
		return today.isSame(
			moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, "jYYYY/jM/jD"),
			"day",
		);
	}

	private async getDaysWithNotes(): Promise<number[]> {
		const notesLocation = this.settings.dailyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePrefix = notesLocation ? `${notesLocation}/` : "";
		const jy = this.currentJalaaliYear;
		const jm = this.currentJalaaliMonth.toString().padStart(2, "0");
		const files = this.app.vault.getFiles();
		const noteDays: number[] = [];

		files.forEach((file) => {
			if (!file.path.startsWith(filePrefix) || file.extension !== "md") {
				return;
			}

			const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
			if (!match) return;

			const [, year, month, day] = match.map(Number);

			if (this.settings.dateFormat === "georgian") {
				const { jy: convJy, jm: convJm, jd: convJd } = toJalaali(new Date(year, month - 1, day));
				if (convJy === jy && convJm === parseInt(jm)) {
					noteDays.push(convJd);
				}
			} else {
				if (year === jy && month === parseInt(jm)) {
					noteDays.push(day);
				}
			}
		});

		return noteDays;
	}

	private async getWeeksWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.settings.weeklyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePrefix = notesLocation ? `${notesLocation}/` : "";

		const files = this.app.vault.getFiles();
		const weekNumbers: number[] = files
			.filter((file) => {
				const expectedStart = `${filePrefix}${jy}-W`;
				return file.path.startsWith(expectedStart) && file.extension === "md";
			})
			.map((file) => {
				const match = file.name.match(/W(\d+)/);
				return match ? parseInt(match[1], 10) : null;
			})
			.filter((weekNumber) => weekNumber !== null) as number[];

		return weekNumbers;
	}

	private toFarsiDigits(num: number | string): string {
		const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
		return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit, 10)]);
	}

	private calculateFirstDayOfWeekIndex(jy: number, jm: number): number {
		const { gy, gm, gd } = toGregorian(jy, jm, 1);

		const firstDayDate = new Date(gy, gm - 1, gd);

		const dayOfWeek = firstDayDate.getDay();

		const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

		return adjustedDayOfWeek;
	}

	private changeMonth(offset: number): void {
		let newMonth = this.currentJalaaliMonth + offset;
		let newYear = this.currentJalaaliYear;
		if (newMonth > 12) {
			newMonth = 1;
			newYear++;
		} else if (newMonth < 1) {
			newMonth = 12;
			newYear--;
		}
		this.currentJalaaliMonth = newMonth;
		this.currentJalaaliYear = newYear;
		this.render();
	}

	private calculateDaysFromPreviousMonth(firstDayOfWeek: number): number[] {
		const previousMonth = this.currentJalaaliMonth === 1 ? 12 : this.currentJalaaliMonth - 1;
		const previousYear =
			this.currentJalaaliMonth === 1 ? this.currentJalaaliYear - 1 : this.currentJalaaliYear;
		const lastDayOfPreviousMonth = jalaaliMonthLength(previousYear, previousMonth);
		const daysFromPrevMonth: number[] = [];

		const daysToInclude = firstDayOfWeek;

		for (let i = lastDayOfPreviousMonth - daysToInclude + 1; i <= lastDayOfPreviousMonth; i++) {
			daysFromPrevMonth.push(i);
		}

		return daysFromPrevMonth;
	}

	private calculateDaysFromNextMonth(firstDayOfWeek: number, currentMonthLength: number): number[] {
		const daysFromNextMonth: number[] = [];

		const daysToInclude = 6 * 7 - currentMonthLength - firstDayOfWeek;

		for (let i = 1; i <= daysToInclude; i++) {
			daysFromNextMonth.push(i);
		}

		return daysFromNextMonth;
	}

	private async loadCurrentMonth() {
		const { jy, jm } = getJalaliNow();
		this.currentJalaaliYear = jy;
		this.currentJalaaliMonth = jm;
	}

	private getCurrentJalaaliDate(): JalaaliDate {
		const now = new Date();
		const todayJalaali = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
		return {
			jy: this.currentJalaaliYear || todayJalaali.jy,
			jm: this.currentJalaaliMonth || todayJalaali.jm,
			jd: 1,
		};
	}

	private getWeekNumbersForMonth(jalaaliDate: { jy: number; jm: number }): number[] {
		moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });
		const startOfMonth = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/1`, "jYYYY/jM/jD");
		const startWeekNumber = startOfMonth.jWeek();
		const weekNumbers = [];

		for (let i = 0; i < 6; i++) {
			let weekNumberForIthWeek = startWeekNumber + i;

			if (weekNumberForIthWeek > 52) {
				weekNumberForIthWeek -= 52;
			}

			weekNumbers.push(weekNumberForIthWeek);
		}

		return weekNumbers;
	}

	public calculateCurrentWeekNumber(jalaaliDate: { jy: number; jm: number; jd: number }): number {
		moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

		const currentDate = moment(
			`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`,
			"jYYYY/jM/jD",
		);

		const currentWeekNumber = currentDate.jWeek();

		return currentWeekNumber;
	}

	public async openOrCreateDailyNote(dayNumber: number) {
		const year = this.currentJalaaliYear;
		const month = this.currentJalaaliMonth;
		let dateString = `${year}-${month.toString().padStart(2, "0")}-${dayNumber
			.toString()
			.padStart(2, "0")}`;
		if (this.settings.dateFormat === "georgian") {
			const gregorianDate = toGregorian(year, month, dayNumber);
			dateString = `${gregorianDate.gy}-${gregorianDate.gm
				.toString()
				.padStart(2, "0")}-${gregorianDate.gd.toString().padStart(2, "0")}`;
		}
		const notesLocation = this.settings.dailyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${dateString}.md`;

		try {
			let dailyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
			if (!dailyNoteFile) {
				await this.app.vault.create(filePath, "");

				dailyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
			}

			if (dailyNoteFile instanceof TFile) {
				const openLeaf = this.app.workspace
					.getLeavesOfType("markdown")
					.find((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === dailyNoteFile);
				if (openLeaf) {
					this.app.workspace.setActiveLeaf(openLeaf, {});
				} else {
					await this.app.workspace.openLinkText(dailyNoteFile.path, "", false);
				}
			}
		} catch (error) {
			console.error("خطا در حین ساخت روزنوشت رخ داد: ", error);
		}
	}

	public async openOrCreateWeeklyNote(weekNumber: number, jy: number) {
		const weekString = `${jy}-W${weekNumber}`;
		const notesLocation = this.settings.weeklyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${weekString}.md`;

		try {
			let weeklyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);

			if (!weeklyNoteFile) {
				await this.app.vault.create(filePath, "");
				weeklyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
				this.render();
			}

			if (weeklyNoteFile && weeklyNoteFile instanceof TFile) {
				const openLeaf = this.app.workspace
					.getLeavesOfType("markdown")
					.find((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === weeklyNoteFile);
				if (openLeaf) {
					this.app.workspace.setActiveLeaf(openLeaf);
				} else {
					await this.app.workspace.openLinkText(weeklyNoteFile.path, "", false);
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice("خطا در حین ساخت یا باز کردن یادداشت هفتگی");
			} else {
				new Notice("Error creating/opening weekly note");
			}
		}
	}

	public async openOrCreateMonthlyNote(month: number, jy: number) {
		const monthString = `${jy}-${month.toString().padStart(2, "0")}`;
		const notesLocation = this.settings.monthlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${monthString}.md`;

		try {
			let monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);

			if (!monthlyNoteFile) {
				await this.app.vault.create(filePath, "");

				monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
			}

			if (monthlyNoteFile && monthlyNoteFile instanceof TFile) {
				this.openNoteInWorkspace(monthlyNoteFile);
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice("Error creating/opening daily note");
			} else {
				new Notice("an error accured!");
			}
		}
	}

	public async openOrCreateQuarterlyNote(quarter: number, jy: number) {
		const quarterString = `${jy}-Q${quarter}`;

		const notesLocation = this.settings.quarterlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${quarterString}.md`;

		try {
			let quarterlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);

			if (!quarterlyNoteFile) {
				await this.app.vault.create(filePath, "");

				quarterlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
			}

			if (quarterlyNoteFile && quarterlyNoteFile instanceof TFile) {
				this.openNoteInWorkspace(quarterlyNoteFile);
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice(`Error creating/opening quarterly note: ${error.message}`);
			} else {
				new Notice("An unknown error occurred while handling the quarterly note");
			}
		}
	}

	public async openOrCreateYearlyNote(jy: number) {
		const yearString = `${jy}`;
		const notesLocation = this.settings.yearlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${yearString}.md`;

		try {
			let yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);

			if (!yearlyNoteFile) {
				await this.app.vault.create(filePath, "");

				yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
			}

			if (yearlyNoteFile && yearlyNoteFile instanceof TFile) {
				this.openNoteInWorkspace(yearlyNoteFile);
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice("Error creating/opening yearly note");
			} else {
				new Notice("An unknown error occurred");
			}
		}
	}

	private async openNoteInWorkspace(noteFile: TFile): Promise<void> {
		const isOpen = this.app.workspace
			.getLeavesOfType("markdown")
			.some((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);

		if (isOpen) {
			const leaf = this.app.workspace
				.getLeavesOfType("markdown")
				.find((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);
			if (leaf) {
				this.app.workspace.setActiveLeaf(leaf);
			}
		} else {
			await this.app.workspace.openLinkText(noteFile.path, "", false);
		}
	}

	private scrollToDay(dayNumber: number) {
		const dayEl = this.containerEl.querySelector(`.calendar-day[data-day="${dayNumber}"]`);
		if (dayEl) {
			dayEl.scrollIntoView();
		}
	}

	private async goToToday() {
		const { jy, jm, jd } = getJalaliNow();
		this.currentJalaaliYear = jy;
		this.currentJalaaliMonth = jm;
		this.render();
		this.scrollToDay(jd);

		this.openOrCreateDailyNote(jd);
	}

	public getCurrentQuarter(): { quarter: number; jy: number } {
		const month = this.currentJalaaliMonth;
		const year = this.currentJalaaliYear;
		let quarter = 1;

		if (month >= 1 && month <= 3) quarter = 1;
		else if (month >= 4 && month <= 6) quarter = 2;
		else if (month >= 7 && month <= 9) quarter = 3;
		else if (month >= 10 && month <= 12) quarter = 4;

		return { quarter, jy: year };
	}

	private getMonthName(monthIndex: number): string {
		const monthNames = [
			"فروردین",
			"اردیبهشت",
			"خرداد",
			"تیر",
			"مرداد",
			"شهریور",
			"مهر",
			"آبان",
			"آذر",
			"دی",
			"بهمن",
			"اسفند",
		];
		return monthNames[monthIndex - 1];
	}

	public async refreshCalendarDots(file: TFile, isCreation: boolean): Promise<void> {
		if (!this.containerEl) {
			console.error("Attempting to refresh dots but containerEl is not set.");
			return;
		}
		await this.render();
	}

	public getEventsForDate(
		jy: number,
		jm: number,
		jd: number,
	): { title: string; isHoliday: boolean }[] {
		const events: { title: string; isHoliday: boolean }[] = [];
		const addEvent = (event: { title: string; isHoliday: boolean }) => events.push(event);

		// Persian Calendar Holidays
		if (
			this.plugin.settings.showOfficialIranianCalendar ||
			this.plugin.settings.showAncientIranianCalendar
		) {
			PersianCalendarHolidays.forEach((event) => {
				if (event.month === jm && event.day === jd) {
					if (this.plugin.settings.showOfficialIranianCalendar && event.type === "Iran") {
						addEvent({ title: event.title, isHoliday: event.holiday });
					}
					if (this.plugin.settings.showAncientIranianCalendar && event.type === "Ancient Iran") {
						addEvent({ title: event.title, isHoliday: event.holiday });
					}
				}
			});
		}

		// Hijri Calendar Holidays
		if (this.plugin.settings.showShiaCalendar) {
			const gregorianDate = jalaali.toGregorian(jy, jm, jd);
			const persianDate = { jy: jy, jm: jm, jd: jd };
			const ummalquraAdjustment = this.plugin.settings.hijriDateAdjustment;

			const hijriDateResult = this.getHijriDate(
				persianDate,
				this.plugin.settings.hijriCalendarType,
				ummalquraAdjustment,
			);

			const hijriMomentDate = hijriMoment(
				`${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`,
				"YYYY-M-D",
			);
			hijriMomentDate.iYear(hijriDateResult.hy);
			hijriMomentDate.iMonth(hijriDateResult.hm - 1); // iMonth is 0-indexed
			hijriMomentDate.iDate(hijriDateResult.hd);

			HijriCalendarHolidays.forEach((event) => {
				if (event.month === hijriMomentDate.iMonth() + 1 && event.day === hijriMomentDate.iDate()) {
					addEvent({ title: event.title, isHoliday: event.holiday });
				}
			});
		}

		// Gregorian Calendar Holidays
		if (this.plugin.settings.showOfficialIranianCalendar) {
			const gregorianDate = jalaali.toGregorian(jy, jm, jd);
			GregorianCalendarHolidays.forEach((event) => {
				if (event.month === gregorianDate.gm && event.day === gregorianDate.gd) {
					addEvent({ title: event.title, isHoliday: event.holiday });
				}
			});
		}

		return events;
	}

	private showTooltip(
		e: MouseEvent | TouchEvent,
		dayElement: HTMLElement,
		events: { title: string; isHoliday: boolean }[],
	): void {
		let tooltip = document.querySelector(".calendar-tooltip") as HTMLElement;

		if (!tooltip) {
			tooltip = document.createElement("div");
			tooltip.className = "calendar-tooltip";
			document.body.appendChild(tooltip);
		}

		tooltip.innerHTML = events
			.map(
				(event) =>
					`<div style="color: ${event.isHoliday ? "var(--text-error)" : "var(--text-normal)"}">${
						event.title
					}</div>`,
			)
			.join("");
		tooltip.style.display = "block";

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (e instanceof TouchEvent) {
			const touch = e.touches[0];
			x = touch.pageX;
			y = touch.pageY;
		}

		if (x !== undefined && y !== undefined) {
			tooltip.style.left = `${x - tooltip.offsetWidth - 10}px`;
			tooltip.style.top = `${y + 10}px`;
		}
	}

	private hideTooltip(): void {
		const tooltip = document.querySelector(".calendar-tooltip") as HTMLElement;
		if (tooltip) {
			tooltip.style.display = "none";
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
		calendarType: string,
		ummalquraAdjustment: number,
	): { hy: number; hm: number; hd: number } {
		if (calendarType === "ummalqura") {
			const gregorianDate = jalaali.toGregorian(persianDate.jy, persianDate.jm, persianDate.jd);
			const gregorianDateStr = `${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`;
			const hijriMomentDate = hijriMoment(gregorianDateStr, "YYYY-M-D").add(
				ummalquraAdjustment,
				"days",
			);
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
}
