import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TSetting, TNumberOfMonths, TLocal, TNumberOfSeasons } from "src/types";
import {
	dateToJalali,
	getJalaliMonthName,
	dateToEvents,
	jalaliToSeason,
} from "src/utils/dateUtils";
import { toArNumber, toFaNumber } from "src/utils/numberConverter";
import { NoteService, CalendarState, TooltipService, GridService } from "..";
import { setIcon } from "obsidian";
import { RTLNotice } from "src/utils/RTLNotice";

export default class RenderService {
	private readonly tooltipService: TooltipService;
	private readonly gridService: GridService;

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly settings: TSetting,
	) {
		this.tooltipService = new TooltipService();
		this.gridService = new GridService(calendarState, settings);
	}

	public async render() {
		const containerEl = this.containerEl;
		containerEl.empty();

		await this.renderHeader(containerEl);

		const contentEl = containerEl.createEl("div", { cls: "persian-calendar-content" });

		const { jYearState, jMonthState } = this.calendarState.getJState();
		await this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		await this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState });

		if (this.settings.showSeasonalNotes) {
			await this.renderSeasonalNotesRow(contentEl);
		}
	}

	private async renderHeader(containerEl: HTMLElement) {
		const headerEl = containerEl.createEl("div", { cls: "persian-calendar-header" });

		const navContainerEl = headerEl.createEl("div", { cls: "persian-calendar-navigation" });

		const nextMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar-change-month-arrow",
		});
		setIcon(nextMonthArrow, "square-chevron-left");

		nextMonthArrow.addEventListener("click", () => this.changeMonth("next"));

		const todayButton = navContainerEl.createEl("span", { cls: "persian-calendar-today-button" });
		todayButton.textContent = "امروز";
		todayButton.addEventListener("click", () => {
			this.goToToday();
		});

		const prevMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar-change-month-arrow",
		});
		setIcon(prevMonthArrow, "square-chevron-right");

		prevMonthArrow.addEventListener("click", () => this.changeMonth("prev"));

		const monthYearEl = headerEl.createEl("div", { cls: "persian-calendar-month-year" });
		const monthEl = monthYearEl.createEl("span", { cls: "persian-calendar-month" });
		const yearEl = monthYearEl.createEl("span", { cls: "persian-calendar-year" });

		const georgianMonthYearEl = monthYearEl.createEl("div", {
			cls: "persian-calendar-gregorian-month-year",
		});
		const hijriMonthYearEl = monthYearEl.createEl("div", {
			cls: "persian-calendar-hijri-month-year",
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
			this.notesService.openOrCreateMonthlyNote(jMonthState, jYearState);
		});

		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.notesService.openOrCreateYearlyNote(jYearState);
		});
	}

	private async renderWeekNumbers(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		let weekNumbersEl = contentEl.querySelector(".persian-calendar-week-numbers");
		if (weekNumbersEl) {
			weekNumbersEl.remove();
		}

		weekNumbersEl = contentEl.createEl("div", { cls: "persian-calendar-week-numbers" });

		const weekHeader = weekNumbersEl.createEl("div", { cls: "persian-calendar-week-header" });
		setIcon(weekHeader, "refresh-ccw");

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(jalaliDate.jy, jalaliDate.jm);
		const weeksWithNotes = await this.notesService.getWeeksWithNotes(jalaliDate.jy);

		for (let i = 0; i < 6; i++) {
			const weekNumber = weekNumbers[i];
			const weekEl = weekNumbersEl.createEl("div", { cls: "persian-calendar-week-number" });
			weekEl.textContent = toFaNumber(weekNumber);

			if (!weeksWithNotes.includes(weekNumber)) {
				weekEl.addClass("no-notes");
			}

			weekEl.addEventListener("click", () => {
				this.notesService.openOrCreateWeeklyNote(weekNumber, jalaliDate.jy);
			});
		}

		weekHeader.addEventListener("click", async (e) => {
			e.stopPropagation();
			await this.render();
			RTLNotice("نمایش تقویم بروزرسانی شد.");
		});
	}

	private async renderDaysGrid(
		contentEl: HTMLElement,
		jalaliDate: { jy: number; jm: number },
		local: TLocal = "fa",
	) {
		let gridEl = contentEl.querySelector(".persian-calendar-days-grid") as HTMLElement | null;
		gridEl?.remove();
		gridEl = contentEl.createEl("div", { cls: "persian-calendar-days-grid" });

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[local];
		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = gridEl!.createEl("div", { cls: "persian-calendar-weekday-header" });
			headerCell.textContent = shortName;
			headerCell.classList.add("dynamic-grid-placement");
			headerCell.style.setProperty("--dynamic-grid-start", (i + 1).toString());
		}

		const daysWithNotesArray = await this.notesService.getDaysWithNotes(jy, jm);
		const daysWithNotes = new Set(daysWithNotesArray);

		const cells = this.gridService.buildMonthGrid(jy, jm as TNumberOfMonths);

		const attachTooltipListeners = (dayEl: HTMLElement, date: Date) => {
			const handler = (e: MouseEvent | TouchEvent) => {
				const events = dateToEvents(date, this.settings);
				if (events.length > 0) {
					this.tooltipService.showTooltip(e, events);
				}
			};

			dayEl.addEventListener("mouseenter", handler);
			dayEl.addEventListener("mouseleave", () => this.tooltipService.hideTooltip());

			dayEl.addEventListener(
				"touchstart",
				(e) => {
					handler(e);
				},
				{ passive: true },
			);
			dayEl.addEventListener("touchend", () => this.tooltipService.hideTooltip());
			dayEl.addEventListener("touchcancel", () => this.tooltipService.hideTooltip());
		};

		for (const cell of cells) {
			const dayEl = gridEl.createEl("div", { cls: "persian-calendar-day" });

			const persianDateEl = dayEl.createEl("div", { cls: "persian-date" });
			persianDateEl.textContent = toFaNumber(cell.jd);

			if (!cell.isInCurrentMonth) {
				dayEl.addClass("dim");
			}

			if (cell.isInCurrentMonth && !daysWithNotes.has(cell.jd)) {
				dayEl.addClass("no-notes");
			}

			const { showGeorgianDates, showHijriDates } = this.settings;
			const showBothCalendars = showGeorgianDates && showHijriDates;

			if (cell.isInCurrentMonth) {
				if (showGeorgianDates) {
					const cls = showBothCalendars ? "gregorian-date-corner" : "gregorian-date";
					const georgianDateEl = dayEl.createEl("div", { cls });
					georgianDateEl.textContent = cell.gregorian.gd.toString();
				}

				if (showHijriDates) {
					const cls = showBothCalendars ? "hijri-date-corner" : "hijri-date";
					const hijriDateEl = dayEl.createEl("div", { cls });
					hijriDateEl.textContent = toArNumber(cell.hijri.hd);
				}
			}

			if (cell.isToday) {
				dayEl.addClass("today");
			}

			if (cell.isHoliday || cell.isWeekend) {
				dayEl.addClass("holiday");
				dayEl.querySelectorAll(".persian-date, .gregorian-date, .hijri-date").forEach((el) => {
					el.classList.add("holiday");
				});
			}

			dayEl.classList.add("dynamic-day-grid-placement");
			dayEl.style.setProperty("--day-grid-start", (cell.column + 2).toString());

			(dayEl as any).setAttr?.("data-day", cell.jd.toString());

			dayEl.addEventListener("click", () => {
				this.notesService.openOrCreateDailyNote(cell.jy, cell.jm, cell.jd);
			});

			if (cell.isInCurrentMonth) {
				attachTooltipListeners(dayEl, cell.date);
			}
		}
	}

	private async renderSeasonalNotesRow(containerEl: HTMLElement, local: TLocal = "fa") {
		const seasonsRow = containerEl.createDiv({ cls: "persian-calendar-seasons-row" });
		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = await this.notesService.getSeasensWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = seasonsRow.createDiv({
				cls: `persian-calendar-season${seasonNumber === seasonState ? " current-season" : ""}`,
			});

			seasonEl.textContent = seasons[seasonNumber as TNumberOfSeasons];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.addClass("no-notes");
			}

			seasonEl.addEventListener("click", () => {
				this.notesService.openOrCreateSeasonalNote(seasonNumber, jYearState);
			});
		}
	}

	private changeMonth(direction: "prev" | "next") {
		this.calendarState.changeJMonthState(direction === "prev" ? -1 : 1);
		this.render();
	}

	public async goToToday() {
		const { jy, jm, jd } = dateToJalali(new Date());
		this.calendarState.setJState(jy, jm);

		await this.render();
		await this.notesService.openOrCreateDailyNote(jy, jm, jd);
	}
}
