import { TAbstractFile, TFile, TFolder, debounce } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import CalendarView from "src/templates/CalendarView";

export default class EventManager {
	constructor(private plugin: PersianCalendarPlugin) {}

	registerEvents() {
		this.registerFileCreateEvent();
		this.registerFileDeleteEvent();
	}

	private registerFileCreateEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					this.handleFileUpdate();
				}
			}),
		);
	}

	private registerFileDeleteEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				if ((file instanceof TFile && file.path.endsWith(".md")) || file instanceof TFolder) {
					this.handleFileUpdate();
				}
			}),
		);
	}

	private handleFileUpdate() {
		const debouncedRefresh = debounce(() => {
			const leaves = this.plugin.app.workspace.getLeavesOfType("persian-calendar");

			leaves.forEach((leaf) => {
				if (leaf.view instanceof CalendarView) {
					leaf.view.refreshCalendar();
				}
			});
		}, 50);

		debouncedRefresh();
	}
}
