import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type {
	TPluginSetting,
	TNumberOfMonths,
	TLocal,
	TNumberOfSeasons,
	TEventObjectWithoutDate,
} from "src/types";
import {
	dateToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	jalaliToHijri,
	getJalaliMonthName,
	checkHoliday,
	jalaliToDate,
	dateToEvents,
	jalaliToSeason,
} from "src/utils/dateUtils";
import { toArNumber, toFaNumber } from "src/utils/numberConverter";
import { NoteService, CalendarState } from "..";
import { setIcon } from "obsidian";

export default class RenderService {
	private tooltipSelector = ".calendar-tooltip";

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly settings: TPluginSetting,
	) {}

	public async render() {
		const containerEl = this.containerEl;
		containerEl.empty();

		await this.renderHeader(containerEl);

		const contentEl = containerEl.createEl("div", { cls: "calendar-content" });

		const { jYearState, jMonthState } = this.calendarState.getJState();
		await this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		await this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState });

		if (this.settings.showSeasonalNotes) {
			await this.renderSeasonalNotesRow(contentEl);
		}
	}

	private async renderHeader(containerEl: HTMLElement) {
		const headerEl = containerEl.createEl("div", { cls: "calendar-header" });

		const navContainerEl = headerEl.createEl("div", { cls: "calendar-navigation" });

		const prevMonthArrow = navContainerEl.createEl("span", { cls: "calendar-change-month-arrow" });
		setIcon(prevMonthArrow, "square-chevron-left");

		prevMonthArrow.addEventListener("click", () => this.changeMonth(1));

		const todayButton = navContainerEl.createEl("span", { cls: "calendar-today-button" });
		todayButton.textContent = "امروز";
		todayButton.addEventListener("click", () => {
			void this.goToToday();
		});

		const nextMonthArrow = navContainerEl.createEl("span", { cls: "calendar-change-month-arrow" });
		setIcon(nextMonthArrow, "square-chevron-right");

		nextMonthArrow.addEventListener("click", () => this.changeMonth(-1));

		const monthYearEl = headerEl.createEl("div", { cls: "calendar-month-year" });
		const monthEl = monthYearEl.createEl("span", { cls: "calendar-month" });
		const yearEl = monthYearEl.createEl("span", { cls: "calendar-year" });

		const georgianMonthYearEl = monthYearEl.createEl("div", {
			cls: "calendar-gregorian-month-year",
		});
		const hijriMonthYearEl = monthYearEl.createEl("div", {
			cls: "calendar-hijri-month-year",
		});

		const { jYearState, jMonthState } = this.calendarState.getJState();

		const monthName = getJalaliMonthName(jMonthState as TNumberOfMonths);
		monthEl.textContent = monthName;
		yearEl.textContent = toFaNumber(jYearState);

		if (this.settings.showGeorgianDates) {
			const georgianMonthRange = this.calendarState.getGeorgianMonthRange(jYearState, jMonthState);
			georgianMonthYearEl.textContent = georgianMonthRange;
		}

		if (this.settings.showHijriDates) {
			const hijriMonthRange = this.calendarState.getHijriMonthRange(jYearState, jMonthState);
			hijriMonthYearEl.textContent = hijriMonthRange;
		}

		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateMonthlyNote(jMonthState, jYearState);
		});

		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateYearlyNote(jYearState);
		});
	}

	private async renderWeekNumbers(
		contentEl: HTMLElement,
		jalaliDate: { jy: number; jm: number },
	): Promise<void> {
		let weekNumbersEl = contentEl.querySelector(".calendar-week-numbers");
		if (weekNumbersEl) {
			weekNumbersEl.remove();
		}

		weekNumbersEl = contentEl.createEl("div", { cls: "calendar-week-numbers" });

		const weekHeader = weekNumbersEl.createEl("div", { cls: "calendar-week-header" });
		setIcon(weekHeader, "refresh-ccw");

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(jalaliDate.jy, jalaliDate.jm);
		const weeksWithNotes = await this.notesService.getWeeksWithNotes(jalaliDate.jy);

		for (let i = 0; i < 6; i++) {
			const weekNumber = weekNumbers[i];
			const weekEl = weekNumbersEl.createEl("div", { cls: "calendar-week-number" });
			weekEl.textContent = toFaNumber(weekNumber);

			if (!weeksWithNotes.includes(weekNumber)) {
				weekEl.addClass("no-notes");
			}

			weekHeader.addEventListener("click", async (e) => {
				e.stopPropagation();
				await this.render();
			});

			weekEl.addEventListener("click", () => {
				void this.notesService.openOrCreateWeeklyNote(weekNumber, jalaliDate.jy);
			});
		}
	}

	private async renderDaysGrid(
		contentEl: HTMLElement,
		jalaliDate: { jy: number; jm: number },
		local: TLocal = "fa",
	): Promise<void> {
		let gridEl = contentEl.querySelector(".calendar-days-grid") as HTMLElement | null;
		gridEl?.remove();
		gridEl = contentEl.createEl("div", { cls: "calendar-days-grid" });

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[local];

		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = gridEl!.createEl("div", { cls: "calendar-weekday-header" });
			headerCell.textContent = shortName;
			headerCell.classList.add("dynamic-grid-placement");
			headerCell.style.setProperty("--dynamic-grid-start", (i + 1).toString());
		}

		const daysWithNotesArray = await this.notesService.getDaysWithNotes(jy, jm);
		const daysWithNotes = new Set(daysWithNotesArray);

		const daysInMonth = jalaliMonthLength(jy, jm);
		const firstDayOfWeekIndex = this.calendarState.calculateFirstDayOfWeekIndex(jy, jm);
		const totalCells = 42;
		const daysFromPrevMonth =
			this.calendarState.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
		const daysFromNextMonth = this.calendarState.calculateDaysFromNextMonth(
			firstDayOfWeekIndex,
			daysInMonth,
		);

		const isWeekend = (dayOfWeek: number): boolean => {
			const weekend = this.settings.weekendDays;
			if (weekend === "thursday-friday") return dayOfWeek === 5 || dayOfWeek === 6;
			if (weekend === "friday") return dayOfWeek === 6;
			if (weekend === "friday-saturday") return dayOfWeek === 6 || dayOfWeek === 0;
			return false;
		};

		const attachTooltipListeners = (dayEl: HTMLElement, date: Date) => {
			const handler = (e: MouseEvent | TouchEvent) => {
				const events = dateToEvents(date, this.settings);
				if (events.length > 0) {
					this.showTooltip(e, events);
				}
			};

			dayEl.addEventListener("mouseenter", handler);
			dayEl.addEventListener("mouseleave", () => this.hideTooltip());

			dayEl.addEventListener(
				"touchstart",
				(e) => {
					handler(e);
				},
				{ passive: true },
			);
			dayEl.addEventListener("touchend", () => this.hideTooltip());
			dayEl.addEventListener("touchcancel", () => this.hideTooltip());
		};

		const getCellJalaliDate = (index: number) => {
			const dayIndex = index - firstDayOfWeekIndex;
			let dayNumber = dayIndex + 1;
			let cellJy = jy;
			let cellJm = jm;
			let isInCurrentMonth = true;

			if (dayIndex < 0) {
				const prevMonth = jm === 1 ? 12 : jm - 1;
				const prevYear = jm === 1 ? jy - 1 : jy;
				cellJy = prevYear;
				cellJm = prevMonth;
				dayNumber = daysFromPrevMonth[daysFromPrevMonth.length + dayIndex];
				isInCurrentMonth = false;
			} else if (dayIndex >= daysInMonth) {
				const nextMonth = jm === 12 ? 1 : jm + 1;
				const nextYear = jm === 12 ? jy + 1 : jy;
				cellJy = nextYear;
				cellJm = nextMonth;
				dayNumber = daysFromNextMonth[dayIndex - daysInMonth];
				isInCurrentMonth = false;
			}

			return { dayIndex, dayNumber, cellJy, cellJm, isInCurrentMonth };
		};

		for (let i = 0; i < totalCells; i++) {
			const dayEl = gridEl.createEl("div", { cls: "calendar-day" });

			const { dayIndex, dayNumber: jd, cellJy, cellJm, isInCurrentMonth } = getCellJalaliDate(i);

			const date = jalaliToDate(jy, jm, jd);

			const persianDateEl = dayEl.createEl("div", { cls: "persian-date" });
			persianDateEl.textContent = toFaNumber(jd);

			if (!isInCurrentMonth) {
				dayEl.addClass("dim");
			}

			if (isInCurrentMonth && !daysWithNotes.has(jd)) {
				dayEl.addClass("no-notes");
			}

			let holiday = false;
			let isWeekendFlag = false;

			if (isInCurrentMonth) {
				const { showGeorgianDates, showHijriDates, showHolidays } = this.settings;
				const showBothCalendars = showGeorgianDates && showHijriDates;

				if (showHolidays && checkHoliday(date, this.settings)) holiday = true;

				if (showGeorgianDates) {
					const georgianDate = jalaliToGregorian(jy, jm, jd);
					const cls = showBothCalendars ? "gregorian-date-corner" : "gregorian-date";
					const georgianDateEl = dayEl.createEl("div", { cls });
					georgianDateEl.textContent = georgianDate.gd.toString();
				}

				if (this.settings.showHijriDates) {
					const hijriDate = jalaliToHijri(jy, jm, jd);
					const cls = showBothCalendars ? "hijri-date-corner" : "hijri-date";
					const hijriDateEl = dayEl.createEl("div", { cls });
					hijriDateEl.textContent = toArNumber(hijriDate.hd);
				}

				if (this.calendarState.isToday(jy, jm, jd)) {
					dayEl.addClass("today");
				}

				const dayOfWeek = (firstDayOfWeekIndex + dayIndex) % 7;
				isWeekendFlag = isWeekend(dayOfWeek);
			}

			if (holiday || isWeekendFlag) {
				dayEl.addClass("holiday");
				dayEl.querySelectorAll(".persian-date, .gregorian-date, .hijri-date").forEach((el) => {
					el.classList.add("holiday");
				});
			}

			dayEl.classList.add("dynamic-day-grid-placement", "dynamic-day-grid-placement");
			dayEl.style.setProperty("--day-grid-start", ((i % 7) + 2).toString());

			(dayEl as any).setAttr?.("data-day", jd.toString());

			dayEl.addEventListener("click", () => {
				void this.notesService.openOrCreateDailyNote(cellJy, cellJm, jd);
			});

			if (isInCurrentMonth) {
				attachTooltipListeners(dayEl, date);
			}
		}
	}

	private async renderSeasonalNotesRow(
		containerEl: HTMLElement,
		local: TLocal = "fa",
	): Promise<void> {
		const seasonsRow = containerEl.createDiv({ cls: "calendar-seasons-row" });
		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = await this.notesService.getSeasensWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = seasonsRow.createDiv({
				cls: `calendar-season${seasonNumber === seasonState ? " current-season" : ""}`,
			});

			seasonEl.textContent = seasons[seasonNumber as TNumberOfSeasons];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.addClass("no-notes");
			}

			seasonEl.addEventListener("click", () => {
				void this.notesService.openOrCreateSeasonalNote(seasonNumber, jYearState);
			});
		}
	}

	private changeMonth(offset: number): void {
		this.calendarState.changeJMonthState(offset);
		void this.render();
	}

	public scrollToDay(dayNumber: number): void {
		const dayEl = this.containerEl.querySelector(
			`.calendar-day[data-day="${dayNumber}"]`,
		) as HTMLElement | null;
		if (dayEl) {
			dayEl.scrollIntoView();
		}
	}

	public async goToToday(): Promise<void> {
		const { jy, jm, jd } = dateToJalali(new Date());
		this.calendarState.setJState(jy, jm);
		await this.render();
		this.scrollToDay(jd);
		await this.notesService.openOrCreateDailyNote(jy, jm, jd);
	}

	private getOrCreateTooltip(): HTMLElement {
		let tooltip = document.querySelector(this.tooltipSelector) as HTMLElement | null;

		if (!tooltip) {
			tooltip = document.createElement("div");
			tooltip.className = "calendar-tooltip";
			document.body.appendChild(tooltip);
		}

		return tooltip;
	}

	private showTooltip(e: MouseEvent | TouchEvent, events: TEventObjectWithoutDate[]): void {
		const tooltip = this.getOrCreateTooltip();

		tooltip.innerHTML = events
			.map(
				({ title, holiday }) =>
					`<div style="color: ${holiday ? "var(--text-error)" : "var(--text-normal)"}">${
						title
					}</div>`,
			)
			.join("");

		tooltip.style.display = "block";

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (e instanceof TouchEvent && e.touches.length > 0) {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;
		}

		if (x !== undefined && y !== undefined) {
			tooltip.style.left = `${x - tooltip.offsetWidth - 10}px`;
			tooltip.style.top = `${y + 10}px`;
		}
	}

	private hideTooltip(): void {
		const tooltip = document.querySelector(this.tooltipSelector) as HTMLElement | null;
		if (tooltip) {
			tooltip.style.display = "none";
		}
	}
}
