import { TAbstractFile, TFile, TFolder, debounce } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import CalendarView from "src/templates/CalendarView";

export default class EventManager {
	private isLayoutReady = false;

	constructor(private plugin: PersianCalendarPlugin) {
		this.plugin.app.workspace.onLayoutReady(() => {
			setTimeout(() => {
				this.isLayoutReady = true;
			}, 3000);
		});
	}

	registerEvents() {
		this.registerFileCreateEvent();
		this.registerFileModifyEvent();
		this.registerFileDeleteEvent();
	}

	private registerFileCreateEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					if (!this.isLayoutReady) return;

					setTimeout(async () => {
						await this.plugin.placeholder.insertPersianDate(file);
					}, 300);
					this.handleFileUpdate();
				}
			}),
		);
	}

	private registerFileModifyEvent() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.endsWith(".md")) {
					const isNewFile = Date.now() - file.stat.ctime < 2000;

					if (isNewFile) {
						await this.plugin.placeholder.insertPersianDate(file);
					}

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
