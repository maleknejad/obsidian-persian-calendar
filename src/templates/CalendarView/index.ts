import { WorkspaceLeaf, App, View } from "obsidian";
import PersianCalendarPlugin from "src/main";
import { NoteService } from "src/services";
import { dateToJalali } from "src/utils/dateUtils";
import CalendarNavigation from "./CalendarRenderer/CalendarNavigation";
import CalendarState from "./CalendarState";
import CalendarRenderer from "./CalendarRenderer";
import type { TSetting, TJalali } from "src/types";

export default class CalendarView extends View {
	dailyCheckInterval: number | undefined;
	lastCheckedDate: TJalali = dateToJalali(new Date());
	plugin: PersianCalendarPlugin;
	settings: TSetting;
	private calendarNavigation: CalendarNavigation;
	private calendarState: CalendarState;
	private notesService: NoteService;
	private calendarRenderer: CalendarRenderer;

	constructor(leaf: WorkspaceLeaf, app: App, plugin: PersianCalendarPlugin) {
		super(leaf);
		this.app = app;
		this.settings = plugin.settings;
		this.plugin = plugin;
		this.calendarState = new CalendarState();
		this.notesService = new NoteService(this.app, this.plugin);
		this.calendarRenderer = new CalendarRenderer(
			this.containerEl,
			this.calendarState,
			this.notesService,
			this.settings,
		);
		this.calendarNavigation = new CalendarNavigation(
			this.calendarState,
			this.calendarRenderer.render,
		);
	}

	getViewType() {
		return "persian-calendar";
	}

	getDisplayText() {
		return "Persian Calendar";
	}

	getIcon() {
		return "calendar-heart";
	}

	async onOpen() {
		this.startDailyCheckInterval();
		await this.render();
	}

	async onClose() {
		this.stopDailyCheckInterval();
	}

	public async render() {
		await this.calendarRenderer.render();
	}

	public async goToToday() {
		await this.calendarNavigation.goToToday();
	}

	public async refreshCalendar() {
		if (!this.containerEl) {
			return;
		}
		await this.render();
	}

	private startDailyCheckInterval() {
		this.stopDailyCheckInterval();
		this.dailyCheckInterval = window.setInterval(() => {
			const today = dateToJalali(new Date());
			if (
				today.jy !== this.lastCheckedDate.jy ||
				today.jm !== this.lastCheckedDate.jm ||
				today.jd !== this.lastCheckedDate.jd
			) {
				this.lastCheckedDate = today;
				this.render();
			}
		}, 60 * 1000);
	}

	private stopDailyCheckInterval() {
		if (this.dailyCheckInterval !== undefined) {
			window.clearInterval(this.dailyCheckInterval);
			this.dailyCheckInterval = undefined;
		}
	}

	static async activateView(plugin: PersianCalendarPlugin): Promise<WorkspaceLeaf | null> {
		const existingLeaves = plugin.app.workspace.getLeavesOfType("persian-calendar");

		if (existingLeaves.length > 0) {
			plugin.app.workspace.revealLeaf(existingLeaves[0]);
			return existingLeaves[0];
		}

		const leaf =
			plugin.app.workspace.getRightLeaf(false) ??
			plugin.app.workspace.getRightLeaf(true) ??
			plugin.app.workspace.getLeaf("tab");

		await leaf.setViewState({
			type: "persian-calendar",
			active: true,
		});

		plugin.app.workspace.revealLeaf(leaf);
		return leaf;
	}

	static refreshAllViews(plugin: PersianCalendarPlugin): void {
		const leaves = plugin.app.workspace.getLeavesOfType("persian-calendar");

		leaves.forEach((leaf) => {
			if (leaf.view instanceof CalendarView) {
				leaf.view.render();
			}
		});
	}

	static detachAllViews(plugin: PersianCalendarPlugin): void {
		plugin.app.workspace.getLeavesOfType("persian-calendar").forEach((leaf) => leaf.detach());
	}
}
