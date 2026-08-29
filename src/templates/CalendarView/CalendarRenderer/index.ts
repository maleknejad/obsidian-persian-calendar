import type { NoteService } from "src/services";
import type { TSetting } from "src/types";
import { addClasses } from "src/utils/dom";

import type CalendarState from "../CalendarState";
import CalendarBodyRender from "./CalendarBody";
import CalendarHeaderRender from "./CalendarHeader";
import CalendarNavigation from "./CalendarNavigation";
import { safeRender } from "./renderErrorBoundary";

export default class CalendarRenderer {
	private readonly headerRenderer: CalendarHeaderRender;
	private readonly bodyRenderer: CalendarBodyRender;
	private readonly navigation: CalendarNavigation;

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly setting: TSetting,
	) {
		this.navigation = new CalendarNavigation(this.calendarState, () => {
			this.render();
		});

		this.headerRenderer = new CalendarHeaderRender(
			this.calendarState,
			this.notesService,
			this.setting,
			this.navigation,
		);

		this.bodyRenderer = new CalendarBodyRender(
			this.calendarState,
			this.notesService,
			this.setting,
			() => {
				this.render();
			},
			this.navigation,
		);
	}

	public render() {
		const containerEl = this.containerEl;
		containerEl.replaceChildren();

		addClasses(containerEl, ["persian-calendar", "persian-calendar__calendar"]);
		containerEl.setAttribute("dir", "rtl");

		// Each stage is guarded independently: a date/path resolution error in
		// (for example) the seasonal-notes row must not also wipe out an
		// already-rendered header, and must never leave the view silently
		// blank. See `safeRender` / `renderErrorBoundary`.
		safeRender(containerEl, "header", () => {
			this.headerRenderer.render(containerEl);
		});

		if (this.setting.showSeasonalNotes) {
			safeRender(containerEl, "seasonalNotes", () => {
				this.bodyRenderer.renderSeasonalNotesRow(containerEl, this.setting.language);
			});
		}

		safeRender(containerEl, "body", () => {
			const contentDiv = document.createElement("div");
			addClasses(contentDiv, "persian-calendar__content");
			containerEl.appendChild(contentDiv);
			this.bodyRenderer.renderContent(contentDiv, this.setting.language);
		});
	}
}
