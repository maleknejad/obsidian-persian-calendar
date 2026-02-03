import CalendarState from "src/templates/CalendarView/CalendarState";
import { dateToJalali } from "src/utils/dateUtils";

export default class CalendarNavigation {
	constructor(
		private readonly calendarState: CalendarState,
		private readonly rerender: () => Promise<void> | void,
	) {}

	public changeMonth(direction: "prev" | "next") {
		this.calendarState.changeJMonthState(direction === "prev" ? -1 : 1);
		this.rerender();
	}

	public async goToToday() {
		const { jy, jm } = dateToJalali(new Date());
		this.calendarState.setJState(jy, jm);
		await this.rerender();
	}
}
