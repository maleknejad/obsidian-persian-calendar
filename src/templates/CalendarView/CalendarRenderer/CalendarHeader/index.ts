import { setIcon } from "obsidian";
import { toFaNumber } from "src/utils/formatters";
import CalendarState from "src/templates/CalendarView/CalendarState";
import { NoteService } from "src/services";
import CalendarNavigation from "../CalendarNavigation";
import { getJalaliMonthName } from "src/utils/dateUtils";
import type { TSetting } from "src/types";

export default class CalendarHeaderRender {
	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly settings: TSetting,
		private readonly navigation: CalendarNavigation,
	) {}

	public async render(containerEl: HTMLElement) {
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

		const monthName = getJalaliMonthName(jMonthState);
		monthEl.textContent = monthName;
		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState);
		});

		const navContainerEl = stateControlEl.createEl("div", {
			cls: "persian-calendar__nav-container",
		});

		const prevMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(prevMonthArrow, "square-chevron-right");
		prevMonthArrow.addEventListener("click", () => this.navigation.changeMonth("prev"));

		const todayButton = navContainerEl.createEl("span", { cls: "persian-calendar__go-today" });
		todayButton.textContent = "امروز";
		todayButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const nextMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(nextMonthArrow, "square-chevron-left");
		nextMonthArrow.addEventListener("click", () => this.navigation.changeMonth("next"));
	}
}
