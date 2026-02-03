import CalendarState from "src/templates/CalendarView/CalendarState";
import {
	jalaliMonthLength,
	jalaliToDate,
	jalaliToGregorian,
	jalaliToHijri,
	checkHoliday,
} from "src/utils/dateUtils";
import type { TSetting, TMonthGridCell } from "src/types";

export default class GridService {
	constructor(
		private readonly calendarState: CalendarState,
		private readonly settings: TSetting,
	) {}

	private isWeekend(dayOfWeek: number): boolean {
		const weekend = this.settings.weekendDays;
		if (weekend === "thursday-friday") return dayOfWeek === 5 || dayOfWeek === 6;
		if (weekend === "friday") return dayOfWeek === 6;
		if (weekend === "friday-saturday") return dayOfWeek === 6 || dayOfWeek === 0;
		return false;
	}

	private getCellJalaliDate(params: {
		index: number;
		jy: number;
		jm: number;
		daysInMonth: number;
		daysFromPrevMonth: number[];
		daysFromNextMonth: number[];
		firstDayOfWeekIndex: number;
	}) {
		const {
			index,
			jy,
			jm,
			daysInMonth,
			daysFromPrevMonth,
			daysFromNextMonth,
			firstDayOfWeekIndex,
		} = params;

		const dayIndex = index - firstDayOfWeekIndex;
		let dayNumber = dayIndex + 1;
		let cellJy = jy;
		let cellJm = jm;
		let isInCurrentMonth = true;

		if (dayIndex < 0) {
			const prevMonth = jm === 1 ? 12 : jm - 1;
			const prevYear = jm === 1 ? jy - 1 : jy;
			cellJy = prevYear;
			cellJm = prevMonth;
			dayNumber = daysFromPrevMonth[daysFromPrevMonth.length + dayIndex];
			isInCurrentMonth = false;
		} else if (dayIndex >= daysInMonth) {
			const nextMonth = jm === 12 ? 1 : jm + 1;
			const nextYear = jm === 12 ? jy + 1 : jy;
			cellJy = nextYear;
			cellJm = nextMonth;
			dayNumber = daysFromNextMonth[dayIndex - daysInMonth];
			isInCurrentMonth = false;
		}

		return { dayIndex, dayNumber, cellJy, cellJm, isInCurrentMonth };
	}

	//todo: بعضی ماه‌ها پنج هفته‌ای و برخی چهار هفته‌ای هستن. اگه این تشخیصشون بده عالی میشه
	public buildMonthGrid(jy: number, jm: number): TMonthGridCell[] {
		const { showHolidays } = this.settings;

		const daysInMonth = jalaliMonthLength(jy, jm);
		const firstDayOfWeekIndex = this.calendarState.calculateFirstDayOfWeekIndex(jy, jm);
		const totalCells = 42;

		const daysFromPrevMonth =
			this.calendarState.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
		const daysFromNextMonth = this.calendarState.calculateDaysFromNextMonth(
			firstDayOfWeekIndex,
			daysInMonth,
		);

		const cells = [];

		for (let index = 0; index < totalCells; index++) {
			const {
				dayIndex,
				dayNumber: jd,
				cellJy,
				cellJm,
				isInCurrentMonth,
			} = this.getCellJalaliDate({
				index,
				jy,
				jm,
				daysInMonth,
				daysFromPrevMonth,
				daysFromNextMonth,
				firstDayOfWeekIndex,
			});

			const date = jalaliToDate(cellJy, cellJm, jd);
			const gregorian = jalaliToGregorian(cellJy, cellJm, jd);
			const hijri = jalaliToHijri(cellJy, cellJm, jd);

			let isHoliday = false;
			let isWeekendFlag = false;

			if (isInCurrentMonth) {
				const dayOfWeek = (firstDayOfWeekIndex + dayIndex) % 7;
				isWeekendFlag = this.isWeekend(dayOfWeek);

				if (showHolidays && checkHoliday(date)) {
					isHoliday = true;
				}
			}

			const isToday = isInCurrentMonth && this.calendarState.isToday(cellJy, cellJm, jd);

			const row = Math.floor(index / 7);
			const column = index % 7;

			cells.push({
				index,
				row,
				column,
				jy: cellJy,
				jm: cellJm,
				jd,
				isInCurrentMonth,
				isToday,
				isWeekend: isWeekendFlag,
				isHoliday,
				date,
				gregorian,
				hijri,
			});
		}

		return cells;
	}
}
