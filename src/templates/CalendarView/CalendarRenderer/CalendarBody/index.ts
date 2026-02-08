import { setIcon } from "obsidian";
import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import type { TSetting, TLocal } from "src/types";
import { dateToEvents, jalaliToSeason } from "src/utils/dateUtils";
import { toArNumber, toFaNumber } from "src/utils/format";
import CalendarState from "src/templates/CalendarView/CalendarState";
import { NoteService } from "src/services";
import CalendarNavigation from "../CalendarNavigation";
import Tooltip from "./Tooltip";
import GridService from "./GridService";
import RTLNotice from "src/components/RTLNotice";

export default class CalendarBodyRender {
	private readonly tooltip: Tooltip;
	private readonly gridService: GridService;

	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly settings: TSetting,
		private readonly onRefresh: () => Promise<void> | void,
		private readonly navigation: CalendarNavigation,
	) {
		this.tooltip = new Tooltip();
		this.gridService = new GridService(calendarState, settings);
	}

	public async renderContent(contentEl: HTMLElement, local: TLocal = "fa") {
		const { jYearState, jMonthState } = this.calendarState.getJState();
		await this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		await this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState }, local);
	}

	public async renderSeasonalNotesRow(containerEl: HTMLElement, local: TLocal = "fa") {
		const seasonsRow = containerEl.createDiv({ cls: "persian-calendar__seasons-row" });
		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = await this.notesService.getSeasonsWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = seasonsRow.createDiv({
				cls: `persian-calendar__season${
					seasonNumber === seasonState ? " persian-calendar__season--current" : ""
				}`,
			});

			seasonEl.textContent = seasons[seasonNumber];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.addClass("persian-calendar__season--no-note");
			}

			seasonEl.addEventListener("click", () => {
				this.notesService.openOrCreateSeasonalNote(jYearState, seasonNumber);
			});
		}
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
			await this.onRefresh();
			RTLNotice("نمایش تقویم بروزرسانی شد.");
		});

		const { jy, jm } = jalaliDate;

		const weeksCount = this.calendarState.getWeeksCountForMonth(jy, jm);
		contentEl.style.setProperty("--persian-calendar-weeks-count", String(weeksCount));

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(jy, jm);
		const weeksWithNotes = await this.notesService.getWeeksWithNotes(jy);

		for (let i = 0; i < weekNumbers.length; i++) {
			const weekNumber = weekNumbers[i];

			const weekEl = weekNumbersEl.createEl("div", {
				cls: "persian-calendar__week-number",
			});
			weekEl.textContent = toFaNumber(weekNumber);

			if (!weeksWithNotes.includes(weekNumber)) {
				weekEl.addClass("persian-calendar__no-note");
			}

			weekEl.addEventListener("click", () => {
				this.notesService.openOrCreateWeeklyNote(jy, weekNumber);
			});
		}
	}

	private async renderDaysGrid(
		contentEl: HTMLElement,
		jalaliDate: { jy: number; jm: number },
		local: TLocal = "fa",
	) {
		const weekdaysHeader = contentEl.createEl("div", {
			cls: "persian-calendar__weekday--container",
		});

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[local];
		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = weekdaysHeader.createEl("div", { cls: "persian-calendar__weekday--name" });
			headerCell.textContent = shortName;
		}

		const daysWithNotesArray = await this.notesService.getDaysWithNotes(jy, jm);
		const daysWithNotes = new Set(daysWithNotesArray);

		const cells = this.gridService.buildMonthGrid(jy, jm);

		const attachTooltipListeners = (dayEl: HTMLElement, date: Date) => {
			const handler = (e: MouseEvent | TouchEvent) => {
				const events = dateToEvents(date, this.settings);
				if (events.length > 0) {
					this.tooltip.showTooltip(e, events);
				}
			};

			dayEl.addEventListener("mouseenter", handler);
			dayEl.addEventListener("mouseleave", () => this.tooltip.hideTooltip());

			dayEl.addEventListener(
				"touchstart",
				(e) => {
					handler(e);
				},
				{ passive: true },
			);
			dayEl.addEventListener("touchend", () => this.tooltip.hideTooltip());
			dayEl.addEventListener("touchcancel", () => this.tooltip.hideTooltip());
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

			dayEl.classList.add("persian-calendar__day-grid");

			(dayEl as any).setAttr?.("data-day", cell.jd.toString());

			dayEl.addEventListener("click", () => {
				this.notesService.openOrCreateDailyNote(cell.jy, cell.jm, cell.jd);

				if (!cell.isInCurrentMonth && cell.jd > 15) {
					this.navigation.changeMonth("prev");
					return;
				}

				if (!cell.isInCurrentMonth && cell.jd < 15) {
					this.navigation.changeMonth("next");
					return;
				}
			});

			if (cell.isInCurrentMonth) {
				attachTooltipListeners(dayEl, cell.date);
			}
		}
	}
}
