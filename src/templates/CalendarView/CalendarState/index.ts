import {
	dateToJalali,
	jalaliToDate,
	jalaliToGregorian,
	jalaliMonthLength,
	dateToJWeekNumber,
	gregorianToHijri,
	todayTehran,
} from "src/utils/dateUtils";
import { toFaNumber } from "src/utils/formatters";
import { GREGORIAN_MONTHS_NAME, HIJRI_MONTHS_NAME } from "src/constants";

export default class CalendarState {
	public jYearState: number;
	public jMonthState: number;

	constructor(initial?: { jYear: number; jMonth: number }) {
		if (initial) {
			this.jYearState = initial.jYear;
			this.jMonthState = initial.jMonth;
		} else {
			const today = dateToJalali(todayTehran());

			this.jYearState = today.jy;
			this.jMonthState = today.jm;
		}
	}

	public setJState(jYearState: number, jMonthState: number) {
		this.jYearState = jYearState;
		this.jMonthState = jMonthState;
	}

	public getJState() {
		return {
			jYearState: this.jYearState,
			jMonthState: this.jMonthState,
		};
	}

	public changeJMonthState(offset: number) {
		const totalMonths = this.jYearState * 12 + (this.jMonthState - 1) + offset;

		this.jYearState = Math.floor(totalMonths / 12);
		this.jMonthState = (totalMonths % 12) + 1;
	}

	public calculateDaysFromPreviousMonth(firstDayOfWeek: number) {
		const previousMonth = this.jMonthState === 1 ? 12 : this.jMonthState - 1;
		const previousYear = this.jMonthState === 1 ? this.jYearState - 1 : this.jYearState;

		const lastDayOfPreviousMonth = jalaliMonthLength(previousYear, previousMonth);
		const daysFromPrevMonth: number[] = [];

		const daysToInclude = firstDayOfWeek;

		for (let i = lastDayOfPreviousMonth! - daysToInclude + 1; i <= lastDayOfPreviousMonth!; i++) {
			daysFromPrevMonth.push(i);
		}

		return daysFromPrevMonth;
	}

	public calculateDaysFromNextMonth(
		firstDayOfWeek: number,
		daysInMonth: number,
		totalCells: number = 42,
	) {
		const daysFromPrevCount = firstDayOfWeek;

		const totalDaysInGrid = daysFromPrevCount + daysInMonth;
		const daysToInclude = totalCells - totalDaysInGrid;

		const daysFromNextMonth: number[] = [];

		for (let i = 1; i <= daysToInclude; i++) {
			daysFromNextMonth.push(i);
		}

		return daysFromNextMonth;
	}

	public getWeeksCountForMonth(jy: number, jm: number): number {
		const daysInMonth = jalaliMonthLength(jy, jm);
		const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jy, jm);

		const daysFromPrevMonth = this.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
		const daysFromPrevMonthCount = daysFromPrevMonth.length;

		const totalDaysInGrid = daysFromPrevMonthCount + daysInMonth!;

		const weeks = Math.ceil(totalDaysInGrid / 7);

		return weeks;
	}

	public calculateFirstDayOfWeekIndex(jy: number, jm: number): number {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
		const firstDayDate = new Date(gy, gm - 1, gd);

		const dayOfWeek = firstDayDate.getDay();
		const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

		return adjustedDayOfWeek;
	}

	public getWeekNumbersForMonth(jy: number, jm: number): number[] {
		const startOfMonthDate = jalaliToDate(jy, jm, 1);
		const startWeekNumber = dateToJWeekNumber(startOfMonthDate);

		const weeks = this.getWeeksCountForMonth(jy, jm);

		const weekNumbers: number[] = [];

		for (let i = 0; i < weeks; i++) {
			const weekNumberForIthWeek = startWeekNumber + i;
			weekNumbers.push(weekNumberForIthWeek);
		}

		return weekNumbers;
	}

	//TODO: move to dateUtils
	public isToday(jy: number, jm: number, jd: number): boolean {
		const today = dateToJalali(todayTehran());
		return today.jy === jy && today.jm === jm && today.jd === jd;
	}

	//TODO: move to dateUtils
	public getGeorgianMonthRange(jy: number, jm: number): string {
		const firstDayOfMonthGeorgian = jalaliToGregorian(jy, jm, 1);
		const lastDayOfMonthJalali = jalaliMonthLength(jy, jm);
		const lastDayOfMonthGeorgian = jalaliToGregorian(jy, jm, lastDayOfMonthJalali!);

		const startMonthName =
			GREGORIAN_MONTHS_NAME["en"][
				firstDayOfMonthGeorgian.gm as keyof (typeof GREGORIAN_MONTHS_NAME)["en"]
			];
		const endMonthName =
			GREGORIAN_MONTHS_NAME["en"][
				lastDayOfMonthGeorgian.gm as keyof (typeof GREGORIAN_MONTHS_NAME)["en"]
			];

		if (firstDayOfMonthGeorgian.gm === lastDayOfMonthGeorgian.gm) {
			return `${startMonthName} ${firstDayOfMonthGeorgian.gy}`;
		} else {
			return `${startMonthName} - ${endMonthName} ${lastDayOfMonthGeorgian.gy}`;
		}
	}

	//TODO: move to dateUtils
	public getHijriMonthRange(jy: number, jm: number): string {
		const lastDayOfMonthJalali = jalaliMonthLength(jy, jm);
		const firstDayOfMonthGeorgian = jalaliToGregorian(jy, jm, 1);
		const lastDayOfMonthGeorgian = jalaliToGregorian(jy, jm, lastDayOfMonthJalali!);

		const startHijriDate = gregorianToHijri(
			firstDayOfMonthGeorgian.gy,
			firstDayOfMonthGeorgian.gm,
			firstDayOfMonthGeorgian.gd,
		);

		const endHijriDate = gregorianToHijri(
			lastDayOfMonthGeorgian.gy,
			lastDayOfMonthGeorgian.gm,
			lastDayOfMonthGeorgian.gd,
		);

		const startHijriMonth =
			HIJRI_MONTHS_NAME["fa"][startHijriDate.hm as keyof (typeof HIJRI_MONTHS_NAME)["fa"]];
		const startHijriYear = toFaNumber(startHijriDate.hy);

		const endHijriMonth =
			HIJRI_MONTHS_NAME["fa"][endHijriDate.hm as keyof (typeof HIJRI_MONTHS_NAME)["fa"]];
		const endHijriYear = toFaNumber(endHijriDate.hy);

		if (startHijriDate.hm === endHijriDate.hm) {
			return `${startHijriMonth} ${startHijriYear}`;
		} else {
			return `${startHijriMonth} - ${endHijriMonth} ${endHijriYear}`;
		}
	}
}
