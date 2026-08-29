import { setIcon } from "obsidian";
import { Notice } from "src/components";
import { SEASONS_NAME, WEEKDAYS_NAME } from "src/constants";
import { getDirection, t } from "src/languages";
import type { NoteService } from "src/services";
import type CalendarState from "src/templates/CalendarView/CalendarState";
import type { TLocale, TSetting } from "src/types";
import { jalaliToSeason } from "src/utils/dateUtils";
import { addClasses } from "src/utils/dom";
import { dateToEvents } from "src/utils/eventUtils";
import { toArNumber, toFaNumber } from "src/utils/formatters";

import type CalendarNavigation from "../CalendarNavigation";
import GridService from "./GridService";
import Tooltip from "./Tooltip";

export default class CalendarBodyRender {
	private readonly tooltip: Tooltip;
	private readonly gridService: GridService;

	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
		private readonly onRefresh: () => Promise<void> | void,
		private readonly navigation: CalendarNavigation,
	) {
		this.tooltip = new Tooltip();
		this.gridService = new GridService(calendarState, setting);
	}

	public renderContent(contentEl: HTMLElement, _local: TLocale = "fa") {
		const { jYearState, jMonthState } = this.calendarState.getJState();
		this.renderWeekNumbers(contentEl, { jy: jYearState, jm: jMonthState });
		this.renderDaysGrid(contentEl, { jy: jYearState, jm: jMonthState });
	}

	public renderSeasonalNotesRow(containerEl: HTMLElement, local: TLocale = "fa") {
		const seasonsRow = document.createElement("div");
		addClasses(seasonsRow, "persian-calendar__seasons-row");
		containerEl.appendChild(seasonsRow);

		const { jYearState, jMonthState } = this.calendarState.getJState();

		const seasonState = jalaliToSeason(jMonthState);

		const seasonsWithNotes = this.notesService.getSeasonsWithNotes(jYearState);
		const seasons = SEASONS_NAME[local];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const seasonEl = document.createElement("div");
			addClasses(
				seasonEl,
				`persian-calendar__season${
					seasonNumber === seasonState ? " persian-calendar__season--current" : ""
				}`,
			);
			seasonsRow.appendChild(seasonEl);

			seasonEl.textContent = seasons[seasonNumber];

			if (!seasonsWithNotes.includes(seasonNumber)) {
				seasonEl.classList.add("persian-calendar__season--no-note");
			}

			seasonEl.addEventListener("click", () => {
				void this.notesService.openOrCreateSeasonalNote(jYearState, seasonNumber);
			});
		}
	}

	private renderWeekNumbers(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		contentEl.querySelector(".persian-calendar__week-numbers")?.remove();

		const weekNumbersEl = document.createElement("div");
		addClasses(weekNumbersEl, "persian-calendar__week-numbers");
		contentEl.appendChild(weekNumbersEl);

		const weekHeader = document.createElement("div");
		addClasses(weekHeader, "persian-calendar__refresh");
		weekNumbersEl.appendChild(weekHeader);
		setIcon(weekHeader, "refresh-ccw");

		const iconEl = weekHeader.querySelector("svg");
		iconEl?.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.onRefresh();
			Notice(t("notice.success.refreshView"), getDirection());
		});

		const { jy, jm } = jalaliDate;

		const weeksCount = this.calendarState.getWeeksCountForMonth(jy, jm);
		contentEl.style.setProperty("--persian-calendar-weeks-count", String(weeksCount));

		const weekNumbers = this.calendarState.getWeekNumbersForMonth(
			jy,
			jm,
			this.setting.weekCalculation,
		);

		const weeksWithNotesCache = new Map<number, number[]>();
		const getWeeksWithNotes = (weekYear: number) => {
			let cached = weeksWithNotesCache.get(weekYear);
			if (!cached) {
				cached = this.notesService.getWeeksWithNotes(weekYear);
				weeksWithNotesCache.set(weekYear, cached);
			}
			return cached;
		};

		for (let i = 0; i < weekNumbers.length; i++) {
			const { jy: weekYear, weekNumber } = weekNumbers[i];

			const weekEl = document.createElement("div");
			addClasses(weekEl, "persian-calendar__week-number");
			weekNumbersEl.appendChild(weekEl);
			weekEl.textContent = toFaNumber(weekNumber);

			if (!getWeeksWithNotes(weekYear).includes(weekNumber)) {
				weekEl.classList.add("persian-calendar__no-note");
			}

			weekEl.addEventListener("click", () => {
				void this.notesService.openOrCreateWeeklyNote(weekYear, weekNumber);
			});
		}
	}

	private renderDaysGrid(contentEl: HTMLElement, jalaliDate: { jy: number; jm: number }) {
		const weekdaysHeader = document.createElement("div");
		addClasses(weekdaysHeader, "persian-calendar__weekday--container");
		contentEl.appendChild(weekdaysHeader);

		const { jy, jm } = jalaliDate;

		const weekdays_name = WEEKDAYS_NAME[this.setting.language];
		for (let i = 1; i <= 7; i++) {
			const fullName = weekdays_name[i];
			const shortName = fullName.charAt(0);

			const headerCell = document.createElement("div");
			addClasses(headerCell, "persian-calendar__weekday--name");
			weekdaysHeader.appendChild(headerCell);
			headerCell.textContent = shortName;
		}

		const daysWithNotesArray = this.notesService.getDaysWithNotes(jy, jm);
		const daysWithNotes = new Set(daysWithNotesArray);

		const cells = this.gridService.buildMonthGrid(jy, jm);

		const attachTooltipListeners = (dayEl: HTMLElement, date: Date) => {
			const handler = (e: MouseEvent | TouchEvent) => {
				const events = dateToEvents(date, {
					showEvents: this.setting,
					hijriBase: this.setting.hijriBase,
				});
				if (events.length > 0) {
					this.tooltip.showTooltip(e, events, this.setting.language);
				}
			};

			dayEl.addEventListener("mouseenter", handler);
			dayEl.addEventListener("mouseleave", () => {
				this.tooltip.hideTooltip();
			});

			dayEl.addEventListener(
				"touchstart",
				(e) => {
					handler(e);
				},
				{ passive: true },
			);
			dayEl.addEventListener("touchend", () => {
				this.tooltip.hideTooltip();
			});
			dayEl.addEventListener("touchcancel", () => {
				this.tooltip.hideTooltip();
			});
		};

		contentEl.querySelector(".persian-calendar__days")?.remove();
		const gridEl = document.createElement("div");
		addClasses(gridEl, "persian-calendar__days");
		contentEl.appendChild(gridEl);

		const activeDate = this.calendarState.getActiveJDate();

		for (const cell of cells) {
			const dayEl = document.createElement("div");
			addClasses(dayEl, "persian-calendar__day");
			gridEl.appendChild(dayEl);

			const persianDateEl = document.createElement("div");
			addClasses(persianDateEl, "persian-calendar__jalali-day");
			dayEl.appendChild(persianDateEl);
			persianDateEl.textContent = toFaNumber(cell.jd);

			if (!cell.isInCurrentMonth) {
				dayEl.classList.add("persian-calendar__no-current-month");
			}

			if (cell.isInCurrentMonth && !daysWithNotes.has(cell.jd)) {
				dayEl.classList.add("persian-calendar__no-note");
			}

			const { showGeorgianDates, showHijriDates } = this.setting;

			if (!showGeorgianDates && !showHijriDates) {
				persianDateEl.classList.add("persian-calendar__jalali-day--centered");
			}

			if (cell.isInCurrentMonth) {
				if (showGeorgianDates) {
					const cls = showHijriDates
						? "persian-calendar__gregorian-day--corner"
						: "persian-calendar__gregorian-day--center";
					const georgianDateEl = document.createElement("div");
					addClasses(georgianDateEl, cls);
					dayEl.appendChild(georgianDateEl);
					georgianDateEl.textContent = cell.gregorian.gd.toString();
				}

				if (showHijriDates) {
					const cls = showGeorgianDates
						? "persian-calendar__hijri-day--corner"
						: "persian-calendar__hijri-day--center";
					const hijriDateEl = document.createElement("div");
					addClasses(hijriDateEl, cls);
					dayEl.appendChild(hijriDateEl);
					hijriDateEl.textContent = toArNumber(cell.hijri.hd);
				}
			}

			if (cell.isToday) {
				dayEl.classList.add("persian-calendar__day--current");
			}

			if (
				activeDate &&
				cell.isInCurrentMonth &&
				cell.jy === activeDate.jy &&
				cell.jm === activeDate.jm &&
				cell.jd === activeDate.jd
			) {
				dayEl.classList.add("persian-calendar__day--active");
			}

			if (cell.isHolidayInIran || cell.isWeekend) {
				dayEl.classList.add("persian-calendar__day--holiday");
				dayEl
					.querySelectorAll(
						".persian-calendar__jalali-day, .persian-calendar__gregorian-day--center, .persian-calendar__hijri-day--center",
					)
					.forEach((el) => {
						el.classList.add("persian-calendar__day--holiday");
					});
			}

			dayEl.classList.add("persian-calendar__day-grid");

			dayEl.setAttribute("data-day", cell.jd.toString());

			dayEl.addEventListener("click", () => {
				void this.notesService.openOrCreateDailyNote(cell.jy, cell.jm, cell.jd);

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
