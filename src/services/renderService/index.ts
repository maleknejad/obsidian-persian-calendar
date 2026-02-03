import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TSetting, TNumberOfMonths, TLocal, TNumberOfSeasons } from "src/types";
import {
	dateToJalali,
	getJalaliMonthName,
	dateToEvents,
	jalaliToSeason,
	jalaliMonthLength,
	jalaliToDate,
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

		containerEl.addClass("persian-calendar", "persian-calendar__calendar");

		await this.renderHeader(containerEl);

		if (this.settings.showSeasonalNotes) {
			await this.renderSeasonalNotesRow(containerEl);
		}

		const contentEl = containerEl.createEl("div", { cls: "persian-calendar__content" });

		const { jYearState, jMonthState } = this.calendarState.getJState();
		await this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		await this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState });
	}

	private async renderHeader(containerEl: HTMLElement) {
		const headerEl = containerEl.createEl("div", { cls: "persian-calendar__header" });

		const { jYearState, jMonthState } = this.calendarState.getJState();

		const additionalCalendarStateEl = headerEl.createEl("div", {
			cls: "persian-calendar__additional-calendar-state",
		});

		const hijriMonthYearEl = additionalCalendarStateEl.createEl("div", {
			cls: "persian-calendar__hmonth-hyear",
		});
		const georgianMonthYearEl = additionalCalendarStateEl.createEl("div", {
			cls: "persian-calendar__gmonth-gyear",
		});

		if (this.settings.showGeorgianDates) {
			const georgianMonthRange = this.calendarState.getGeorgianMonthRange(jYearState, jMonthState);
			georgianMonthYearEl.textContent = georgianMonthRange;
		}

		if (this.settings.showHijriDates) {
			const hijriMonthRange = this.calendarState.getHijriMonthRange(jYearState, jMonthState);
			hijriMonthYearEl.textContent = hijriMonthRange;
		}

		const stateControlEl = headerEl.createEl("div", {
			cls: "persian-calendar__state-control",
		});

		const jalaliStateEl = stateControlEl.createEl("div", {
			cls: "persian-calendar__jalali-state",
		});

		const monthEl = jalaliStateEl.createEl("span", { cls: "persian-calendar__jmonth" });
		const yearEl = jalaliStateEl.createEl("span", { cls: "persian-calendar__jyear" });

		yearEl.textContent = toFaNumber(jYearState);
		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.notesService.openOrCreateYearlyNote(jYearState);
		});

		const monthName = getJalaliMonthName(jMonthState as TNumberOfMonths);
		monthEl.textContent = monthName;
		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.notesService.openOrCreateMonthlyNote(jMonthState, jYearState);
		});

		const navContainerEl = stateControlEl.createEl("div", { cls: "persian-calendar__navigation" });

		const prevMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(prevMonthArrow, "square-chevron-right");
		prevMonthArrow.addEventListener("click", () => this.changeMonth("prev"));

		const todayButton = navContainerEl.createEl("span", { cls: "persian-calendar__go-today" });
		todayButton.textContent = "امروز";
		todayButton.addEventListener("click", () => {
			this.goToToday();
		});

		const nextMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(nextMonthArrow, "square-chevron-left");
		nextMonthArrow.addEventListener("click", () => this.changeMonth("next"));
	}

	private async renderWeekNumbers(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		let weekNumbersEl = contentEl.querySelector(".persian-calendar__week-numbers");
		if (weekNumbersEl) {
			weekNumbersEl.remove();
		}

		weekNumbersEl = contentEl.createEl("div", {
			cls: "persian-calendar__week-numbers",
		});

		const weekHeader = weekNumbersEl.createEl("div", {
			cls: "persian-calendar__refresh",
		});
		setIcon(weekHeader, "refresh-ccw");
		const iconEl = weekHeader.querySelector("svg");
		iconEl?.addEventListener("click", async (e) => {
			e.stopPropagation();
			await this.render();
			RTLNotice("نمایش تقویم بروزرسانی شد.");
		});

		const { jy, jm } = jalaliDate;

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(jy, jm);
		const weeksWithNotes = await this.notesService.getWeeksWithNotes(jy);

		const startDay = jalaliToDate(jy, jm, 1).getDay() + 1;
		const firstDayColumn = startDay % 7;
		const monthLength = jalaliMonthLength(jy, jm);

		for (let i = 0; i < 6; i++) {
			const weekNumber = weekNumbers[i];

			const weekEl = weekNumbersEl.createEl("div", {
				cls: "persian-calendar__week-number",
			});
			weekEl.textContent = toFaNumber(weekNumber);

			if (!weeksWithNotes.includes(weekNumber)) {
				weekEl.addClass("persian-calendar__no-note");
			}

			const weekStartDayIndex = 1 - firstDayColumn + i * 7;
			if (weekStartDayIndex > monthLength) {
				weekEl.addClass("persian-calendar__no-current-month");
			}

			weekEl.addEventListener("click", () => {
				// اگر اولین روز این هفته بعد از آخرین روز ماه جاریه، یعنی کل این هفته مال ماه بعده
				if (weekStartDayIndex > monthLength) {
					this.changeMonth("next");
				}

				this.notesService.openOrCreateWeeklyNote(weekNumber, jy);
			});
		}
	}

	private async renderDaysGrid(
		contentEl: HTMLElement,
		jalaliDate: { jy: number; jm: number },
		local: TLocal = "fa",
	) {
		const weekdaysHeader = contentEl.createEl("div", { cls: "persian-calendar__weekdays-header" });

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[local];
		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = weekdaysHeader.createEl("div", { cls: "persian-calendar__weekday-name" });
			headerCell.textContent = shortName;
			headerCell.classList.add("persian-calendar__dynamic-grid");
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

		let gridEl = contentEl.querySelector(".persian-calendar__days") as HTMLElement | null;
		gridEl?.remove();
		gridEl = contentEl.createEl("div", { cls: "persian-calendar__days" });

		for (const cell of cells) {
			const dayEl = gridEl.createEl("div", { cls: "persian-calendar__day" });

			const persianDateEl = dayEl.createEl("div", { cls: "persian-calendar__jalali-day" });
			persianDateEl.textContent = toFaNumber(cell.jd);

			if (!cell.isInCurrentMonth) {
				dayEl.addClass("persian-calendar__no-current-month");
			}

			if (cell.isInCurrentMonth && !daysWithNotes.has(cell.jd)) {
				dayEl.addClass("persian-calendar__no-note");
			}

			const { showGeorgianDates, showHijriDates } = this.settings;
			const showBothCalendars = showGeorgianDates && showHijriDates;

			if (cell.isInCurrentMonth) {
				if (showGeorgianDates) {
					const cls = showBothCalendars
						? "persian-calendar__gregorian-day--corner"
						: "persian-calendar__gregorian-day--center";
					const georgianDateEl = dayEl.createEl("div", { cls });
					georgianDateEl.textContent = cell.gregorian.gd.toString();
				}

				if (showHijriDates) {
					const cls = showBothCalendars
						? "persian-calendar__hijri-day--corner"
						: "persian-calendar__hijri-day--center";
					const hijriDateEl = dayEl.createEl("div", { cls });
					hijriDateEl.textContent = toArNumber(cell.hijri.hd);
				}
			}

			if (cell.isToday) {
				dayEl.addClass("persian-calendar__day--current");
			}

			if (cell.isHoliday || cell.isWeekend) {
				dayEl.addClass("persian-calendar__day--holiday");
				dayEl
					.querySelectorAll(
						".persian-calendar__jalali-day, .persian-calendar__gregorian-day--center, .persian-calendar__hijri-day--center",
					)
					.forEach((el) => {
						el.classList.add("persian-calendar__day--holiday");
					});
			}

			dayEl.classList.add("persian-calendar__dynamic-day-grid");
			dayEl.style.setProperty("--day-grid-start", (cell.column + 2).toString());

			(dayEl as any).setAttr?.("data-day", cell.jd.toString());

			dayEl.addEventListener("click", () => {
				this.notesService.openOrCreateDailyNote(cell.jy, cell.jm, cell.jd);

				if (!cell.isInCurrentMonth && cell.jd > 15) {
					return this.changeMonth("prev");
				}

				if (!cell.isInCurrentMonth && cell.jd < 15) {
					return this.changeMonth("next");
				}
			});

			if (cell.isInCurrentMonth) {
				attachTooltipListeners(dayEl, cell.date);
			}
		}
	}

	private async renderSeasonalNotesRow(containerEl: HTMLElement, local: TLocal = "fa") {
		const seasonsRow = containerEl.createDiv({ cls: "persian-calendar__seasons-row rtl" });
		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = await this.notesService.getSeasensWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = seasonsRow.createDiv({
				cls: `persian-calendar__season${seasonNumber === seasonState ? " persian-calendar__season--current" : ""}`,
			});

			seasonEl.textContent = seasons[seasonNumber as TNumberOfSeasons];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.addClass("persian-calendar__season--no-note");
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
