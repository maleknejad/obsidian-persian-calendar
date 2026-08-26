import type { App } from "obsidian";
import { Modal, setIcon } from "obsidian";
import { JALALI_MONTHS_NAME, WEEKDAYS_NAME } from "src/constants";
import { t } from "src/languages";
import type { TDateFormat, TJalali, TSetting } from "src/types";
import {
	dateToJalali,
	gregorianToDate,
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	todayTehran,
} from "src/utils/dateUtils";
import { extractDayFormat, toDayFormat, toFaNumber } from "src/utils/formatters";

export default class DatePicker extends Modal {
	private setting: TSetting;
	private currentJalali: TJalali;
	private onSelect: (val: string) => void;
	private outputMode: TDateFormat;

	constructor(app: App, setting: TSetting, initial: string | null, cb: (val: string) => void) {
		super(app);

		this.setting = setting;
		this.outputMode = "gregorian";

		if (initial) {
			const parsedDate = extractDayFormat(initial);
			if (parsedDate) {
				if (parsedDate.year > 1700) {
					const gregorianDate = gregorianToDate(parsedDate.year, parsedDate.month, parsedDate.day);
					if (!Number.isNaN(gregorianDate.getTime())) {
						const jalaliDate = gregorianToJalali(
							gregorianDate.getFullYear(),
							gregorianDate.getMonth() + 1,
							gregorianDate.getDate(),
						);
						this.currentJalali = {
							jy: jalaliDate.jy,
							jm: jalaliDate.jm,
							jd: jalaliDate.jd,
						};
						this.outputMode = "gregorian";
					} else {
						this.currentJalali = dateToJalali(todayTehran());
					}
				} else {
					const jalaliMonth = Math.min(Math.max(1, parsedDate.month), 12);
					const maxDaysInMonth = jalaliMonthLength(parsedDate.year, jalaliMonth);
					const jalaliDay = Math.min(Math.max(1, parsedDate.day), maxDaysInMonth);
					this.currentJalali = {
						jy: parsedDate.year,
						jm: jalaliMonth,
						jd: jalaliDay,
					};
					this.outputMode = "jalali";
				}
			} else {
				this.currentJalali = dateToJalali(todayTehran());
				this.outputMode = "gregorian";
			}
		} else {
			this.currentJalali = dateToJalali(todayTehran());
			this.outputMode = "gregorian";
		}

		this.onSelect = cb;
	}

	onOpen() {
		this.containerEl.addClass("persian-calendar__datepicker-container", "persian-calendar");
		this.render();
	}

	private getYear(year: number): string {
		return this.setting.language === "fa" ? toFaNumber(year) : String(year);
	}

	private getMonthName(month: number): string {
		const language = this.setting.language;
		return JALALI_MONTHS_NAME[language][month];
	}

	private getWeekdayLetters(): string[] {
		const language = this.setting.language;
		const weekdaysMap = WEEKDAYS_NAME[language];
		const letters: string[] = [];

		for (let dayIndex = 1; dayIndex <= 7; dayIndex++) {
			const dayName = weekdaysMap[dayIndex] ?? "";
			letters.push(dayName.charAt(0));
		}

		return letters;
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		const rootContainer = contentEl.createEl("div", {
			cls: "persian-calendar__datepicker",
			attr: { dir: "rtl" },
		});

		// Header with navigation buttons
		this.renderHeader(rootContainer);

		// Calendar grid
		this.renderCalendarGrid(rootContainer);

		// Footer with today button
		this.renderFooter(rootContainer);
	}

	private renderHeader(container: HTMLElement) {
		const header = container.createEl("div", { cls: "persian-calendar__datepicker-header" });

		// Previous year button
		const prevYearButton = header.createEl("button", { cls: "persian-calendar__datepicker-arrow" });
		setIcon(prevYearButton, "chevrons-right");
		prevYearButton.onclick = () => {
			this.shiftYear(-1);
		};

		// Previous month button
		const prevMonthButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});
		setIcon(prevMonthButton, "chevron-right");
		prevMonthButton.onclick = () => {
			this.shiftMonth(-1);
		};

		// Month and year title
		header.createEl("span", {
			text: `${this.getMonthName(this.currentJalali.jm)} ${this.getYear(this.currentJalali.jy)}`,
			cls: "persian-calendar__datepicker-jmonth",
		});

		// Next month button
		const nextMonthButton = header.createEl("button", {
			cls: "persian-calendar__datepicker-arrow",
		});
		setIcon(nextMonthButton, "chevron-left");
		nextMonthButton.onclick = () => {
			this.shiftMonth(1);
		};

		// Next year button
		const nextYearButton = header.createEl("button", { cls: "persian-calendar__datepicker-arrow" });
		setIcon(nextYearButton, "chevrons-left");
		nextYearButton.onclick = () => {
			this.shiftYear(1);
		};
	}

	private renderCalendarGrid(container: HTMLElement) {
		const grid = container.createEl("div", {
			cls: "persian-calendar__datepicker-days",
			attr: { role: "grid" },
		});

		// Render weekday headers
		this.getWeekdayLetters().forEach((weekdayLetter) => {
			grid.createEl("span", {
				text: weekdayLetter,
				cls: "persian-calendar__datepicker-weekday",
				attr: { role: "columnheader" },
			});
		});

		// Calculate offset for first day of month
		const firstDayGregorian = jalaliToGregorian(this.currentJalali.jy, this.currentJalali.jm, 1);
		const firstDayJavascript = new Date(
			firstDayGregorian.gy,
			firstDayGregorian.gm - 1,
			firstDayGregorian.gd,
		).getDay();
		const startDayOffset = (firstDayJavascript + 1) % 7;

		// Get previous and next month info
		const previousMonth = this.currentJalali;
		const previousMonthLength = jalaliMonthLength(previousMonth.jy, previousMonth.jm);
		const currentMonthLength = jalaliMonthLength(this.currentJalali.jy, this.currentJalali.jm);

		// Total cells needed: 6 weeks × 7 days = 42 cells
		const totalCells = 42;
		const currentMonthCells = currentMonthLength;
		const previousMonthCells = startDayOffset;
		const nextMonthCells = totalCells - previousMonthCells - currentMonthCells;

		// Render previous month's trailing days
		for (let i = previousMonthCells - 1; i >= 0; i--) {
			const dayNumber = previousMonthLength - i;
			const button = grid.createEl("div", {
				text: toFaNumber(dayNumber),
				cls: "persian-calendar__datepicker-day persian-calendar__datepicker-no-current-month",
			});
			button.tabIndex = -1;
		}

		// Render current month's days
		const today = dateToJalali(todayTehran());

		for (let day = 1; day <= currentMonthLength; day++) {
			const isSelected = day === this.currentJalali.jd;
			const isToday =
				today.jy === this.currentJalali.jy &&
				today.jm === this.currentJalali.jm &&
				today.jd === day;

			const classList = ["persian-calendar__datepicker-day"];
			if (isSelected) classList.push("persian-calendar__datepicker-day--selected");
			if (isToday) classList.push("persian-calendar__datepicker-day--current");

			const dayButton = grid.createEl("div", {
				text: toFaNumber(day),
				cls: classList.join(" "),
			});
			dayButton.onclick = () => {
				this.selectDay(day);
			};
		}

		// Render next month's leading days
		for (let day = 1; day <= nextMonthCells; day++) {
			const button = grid.createEl("div", {
				text: toFaNumber(day),
				cls: "persian-calendar__datepicker-day persian-calendar__datepicker-no-current-month",
			});
			button.tabIndex = -1;
		}
	}

	private renderFooter(container: HTMLElement) {
		const footer = container.createEl("div", { cls: "persian-calendar__datepicker-footer" });

		const toggle = footer.createEl("div", { cls: "persian-calendar__output-toggle" });

		const jalaliOption = toggle.createEl("div", {
			cls: `persian-calendar__output-option ${this.outputMode === "jalali" ? "active" : ""}`,
			text: "شمسی",
		});
		jalaliOption.onclick = () => {
			this.setOutputMode("jalali");
		};

		const gregorianOption = toggle.createEl("div", {
			cls: `persian-calendar__output-option ${this.outputMode === "gregorian" ? "active" : ""}`,
			text: "میلادی",
		});
		gregorianOption.onclick = () => {
			this.setOutputMode("gregorian");
		};

		const currentButton = footer.createEl("button", {
			text: t("current"),
			cls: "persian-calendar__go-current",
		});
		currentButton.onclick = () => {
			this.goToCurrent();
		};
	}

	private setOutputMode(mode: TDateFormat) {
		this.outputMode = mode;
		this.render();
	}

	private selectDay(day: number) {
		this.currentJalali.jd = day;
		const gregorianDate = jalaliToGregorian(this.currentJalali.jy, this.currentJalali.jm, day);

		const formattedOutput =
			this.outputMode === "gregorian"
				? toDayFormat(gregorianDate.gy, gregorianDate.gm, gregorianDate.gd)
				: toDayFormat(this.currentJalali.jy, this.currentJalali.jm, day);

		this.onSelect(formattedOutput);
		this.close();
	}

	private goToCurrent() {
		const today = dateToJalali(todayTehran());
		this.currentJalali = { jy: today.jy, jm: today.jm, jd: today.jd };
		this.render();
	}

	private shiftMonth(delta: number) {
		let { jy: year, jm: month, jd: day } = this.currentJalali;

		month += delta;

		if (month < 1) {
			month = 12;
			year--;
		} else if (month > 12) {
			month = 1;
			year++;
		}

		// Adjust day if it exceeds the maximum for the new month
		const maxDaysInMonth = jalaliMonthLength(year, month);
		day = Math.min(day, maxDaysInMonth);

		this.currentJalali = { jy: year, jm: month, jd: day };
		this.render();
	}

	private shiftYear(delta: number) {
		let { jy: year, jd: day } = this.currentJalali;
		const { jm: month } = this.currentJalali;

		year += delta;

		// Adjust day if it exceeds the maximum for the new month in the new year
		const maxDaysInMonth = jalaliMonthLength(year, month);
		day = Math.min(day, maxDaysInMonth);

		this.currentJalali = { jy: year, jm: month, jd: day };
		this.render();
	}
}
