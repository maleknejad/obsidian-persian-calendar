import type { TSetting } from "src/types";
import { NoteService } from "src/services";
import CalendarState from "../CalendarState";
import CalendarNavigation from "./CalendarNavigation";
import CalendarHeaderRender from "./CalendarHeader";
import CalendarBodyRender from "./CalendarBody";

export default class CalendarRenderer {
	private readonly headerRenderer: CalendarHeaderRender;
	private readonly bodyRenderer: CalendarBodyRender;
	private readonly navigation: CalendarNavigation;

	constructor(
		private readonly containerEl: HTMLElement,
		private readonly calendarState: CalendarState,
		private readonly notesService: NoteService,
		private readonly settings: TSetting,
	) {
		this.navigation = new CalendarNavigation(this.calendarState, () => this.render());

		this.headerRenderer = new CalendarHeaderRender(
			this.calendarState,
			this.notesService,
			this.settings,
			this.navigation,
		);

		this.bodyRenderer = new CalendarBodyRender(
			this.calendarState,
			this.notesService,
			this.settings,
			() => this.render(),
			this.navigation,
		);
	}

	public async render() {
		const containerEl = this.containerEl;
		containerEl.empty();

		containerEl.addClass("persian-calendar", "persian-calendar__calendar");

		await this.headerRenderer.render(containerEl);

		if (this.settings.showSeasonalNotes) {
			await this.bodyRenderer.renderSeasonalNotesRow(containerEl);
		}

		const contentEl = containerEl.createEl("div", { cls: "persian-calendar__content" });
		await this.bodyRenderer.renderContent(contentEl);
	}
}
