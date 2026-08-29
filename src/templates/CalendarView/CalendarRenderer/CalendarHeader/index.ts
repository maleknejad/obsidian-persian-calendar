import { setIcon } from "obsidian";
import { t } from "src/languages";
import type { NoteService } from "src/services";
import type CalendarState from "src/templates/CalendarView/CalendarState";
import type { TSetting } from "src/types";
import { jalaliMonthToRangeDash } from "src/utils/dashUtils";
import { jalaliMonthName } from "src/utils/dateUtils";
import { addClasses } from "src/utils/dom";
import { toFaNumber } from "src/utils/formatters";

import type CalendarNavigation from "../CalendarNavigation";

export default class CalendarHeaderRender {
	constructor(
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
		private readonly navigation: CalendarNavigation,
	) {}

	public render(containerEl: HTMLElement) {
		const headerEl = document.createElement("div");
		addClasses(headerEl, "persian-calendar__header");
		containerEl.appendChild(headerEl);

		const { jYearState, jMonthState } = this.calendarState.getJState();

		const additionalCalendarStateEl = document.createElement("div");
		addClasses(additionalCalendarStateEl, "persian-calendar__additional-calendar-state");
		headerEl.appendChild(additionalCalendarStateEl);

		const hijriMonthYearEl = document.createElement("div");
		addClasses(hijriMonthYearEl, "persian-calendar__hmonth-hyear");
		additionalCalendarStateEl.appendChild(hijriMonthYearEl);

		const georgianMonthYearEl = document.createElement("div");
		addClasses(georgianMonthYearEl, "persian-calendar__gmonth-gyear");
		additionalCalendarStateEl.appendChild(georgianMonthYearEl);

		if (this.setting.showGeorgianDates) {
			const georgianMonthRange = jalaliMonthToRangeDash(jYearState, jMonthState, {
				local: "en",
				dateFormat: "gregorian",
			});
			georgianMonthYearEl.textContent = georgianMonthRange;
		}

		if (this.setting.showHijriDates) {
			const hijriMonthRange = jalaliMonthToRangeDash(jYearState, jMonthState, {
				local: "fa",
				dateFormat: "hijri",
				hijriBase: this.setting.hijriBase,
			});
			hijriMonthYearEl.textContent = hijriMonthRange;
		}

		const stateControlEl = document.createElement("div");
		addClasses(stateControlEl, "persian-calendar__state-control");
		headerEl.appendChild(stateControlEl);

		const jalaliStateEl = document.createElement("div");
		addClasses(jalaliStateEl, "persian-calendar__jalali-state");
		stateControlEl.appendChild(jalaliStateEl);

		const monthEl = document.createElement("span");
		addClasses(monthEl, "persian-calendar__jmonth");
		jalaliStateEl.appendChild(monthEl);
		if (this.setting.language === "fa") {
			monthEl.classList.add("persian-calendar__jmonth--fa");
		} else {
			monthEl.classList.add("persian-calendar__jmonth--en");
		}

		const yearEl = document.createElement("span");
		addClasses(yearEl, "persian-calendar__jyear");
		jalaliStateEl.appendChild(yearEl);
		if (this.setting.language === "fa") {
			yearEl.classList.add("persian-calendar__jyear--fa");
		} else {
			yearEl.classList.add("persian-calendar__jyear--en");
		}

		yearEl.textContent =
			this.setting.language === "fa" ? toFaNumber(jYearState) : String(jYearState);
		yearEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateYearlyNote(jYearState);
		});

		const monthName = jalaliMonthName(jMonthState, this.setting.language);
		monthEl.textContent = monthName;
		monthEl.addEventListener("click", (e) => {
			e.stopPropagation();
			void this.notesService.openOrCreateMonthlyNote(jYearState, jMonthState);
		});

		const navContainerEl = document.createElement("div");
		addClasses(navContainerEl, "persian-calendar__nav-container");
		stateControlEl.appendChild(navContainerEl);

		const prevMonthArrow = document.createElement("span");
		addClasses(prevMonthArrow, "persian-calendar__arrow");
		navContainerEl.appendChild(prevMonthArrow);
		setIcon(prevMonthArrow, "square-chevron-right");
		prevMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("prev");
		});

		const currentButton = document.createElement("span");
		addClasses(currentButton, "persian-calendar__go-current");
		navContainerEl.appendChild(currentButton);
		currentButton.textContent = t("current");
		currentButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const nextMonthArrow = document.createElement("span");
		addClasses(nextMonthArrow, "persian-calendar__arrow");
		navContainerEl.appendChild(nextMonthArrow);
		setIcon(nextMonthArrow, "square-chevron-left");
		nextMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("next");
		});
	}
}
