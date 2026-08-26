import { setIcon } from "obsidian";
import { t } from "src/languages";
import type { NoteService } from "src/services";
import type CalendarState from "src/templates/CalendarView/CalendarState";
import type { TSetting } from "src/types";
import { jalaliMonthToRangeDash } from "src/utils/dashUtils";
import { jalaliMonthName } from "src/utils/dateUtils";
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

		const stateControlEl = headerEl.createEl("div", {
			cls: "persian-calendar__state-control",
		});

		const jalaliStateEl = stateControlEl.createEl("div", {
			cls: "persian-calendar__jalali-state",
		});

		const monthEl = jalaliStateEl.createEl("span", { cls: "persian-calendar__jmonth" });
		if (this.setting.language === "fa") {
			monthEl.addClass("persian-calendar__jmonth--fa");
		} else {
			monthEl.addClass("persian-calendar__jmonth--en");
		}

		const yearEl = jalaliStateEl.createEl("span", { cls: "persian-calendar__jyear" });
		if (this.setting.language === "fa") {
			yearEl.addClass("persian-calendar__jyear--fa");
		} else {
			yearEl.addClass("persian-calendar__jyear--en");
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

		const navContainerEl = stateControlEl.createEl("div", {
			cls: "persian-calendar__nav-container",
		});

		const prevMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(prevMonthArrow, "square-chevron-right");
		prevMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("prev");
		});

		const currentButton = navContainerEl.createEl("span", { cls: "persian-calendar__go-current" });
		currentButton.textContent = t("current");
		currentButton.addEventListener("click", () => {
			void this.navigation.goToToday();
		});

		const nextMonthArrow = navContainerEl.createEl("span", {
			cls: "persian-calendar__arrow",
		});
		setIcon(nextMonthArrow, "square-chevron-left");
		nextMonthArrow.addEventListener("click", () => {
			this.navigation.changeMonth("next");
		});
	}
}
