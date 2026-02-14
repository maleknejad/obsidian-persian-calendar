// TODO: improve this

import { describe, it, expect } from "vitest";
import {
	checkValidJalali,
	checkKabiseh,
	dateToJalali,
	jalaliToDate,
	jalaliToGregorian,
	gregorianToJalali,
	jalaliMonthLength,
	getDaysInJalaliYear,
} from "src/utils/dateUtils/jalaliUtils";

describe("jalaliUtils", () => {
	it("checkValidJalali", () => {
		expect(checkValidJalali(1404, 0, 20)).toBe(false);
		expect(checkValidJalali(1404, 13, 20)).toBe(false);

		expect(checkValidJalali(1404, 12, 29)).toBe(true);
		expect(checkValidJalali(1404, 12, 30)).toBe(false);
	});

	it("checkKabiseh", () => {
		expect(checkKabiseh(1403)).toBe(true);
		expect(checkKabiseh(1404)).toBe(false);
	});

	it("gregorian <-> jalali conversion", () => {
		const g = { gy: 2024, gm: 3, gd: 20 };
		const j = gregorianToJalali(g.gy, g.gm, g.gd);

		expect(j).toEqual({ jy: 1403, jm: 1, jd: 1 });

		const g2 = jalaliToGregorian(j.jy, j.jm, j.jd);
		expect(g2).toEqual(g);
	});

	it("dateToJalali", () => {
		const date = new Date(Date.UTC(2026, 1, 4));
		const { jy, jm, jd } = dateToJalali(date);

		expect(jy).toBe(1404);
		expect(jm).toBe(11);
		expect(jd).toBe(15);
	});

	it("jalaliToDate", () => {
		const date = jalaliToDate(1404, 11, 15);

		const targetDate = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
		};

		expect(targetDate.year).toBe(2026);
		expect(targetDate.month).toBe(2);
		expect(targetDate.day).toBe(4);
	});

	it("jalaliMonthLength", () => {
		expect(jalaliMonthLength(1404, 0)).toBeNull();
		expect(jalaliMonthLength(1404, 13)).toBeNull();

		for (let i = 1; i <= 6; i++) expect(jalaliMonthLength(1404, i)).toBe(31);

		for (let i = 7; i <= 11; i++) expect(jalaliMonthLength(1404, i)).toBe(30);

		expect(jalaliMonthLength(1403, 12)).toBe(30);
		expect(jalaliMonthLength(1404, 12)).toBe(29);
	});

	it("getDaysInJalaliYear", () => {
		expect(getDaysInJalaliYear(1399)).toBe(366);
		expect(getDaysInJalaliYear(1400)).toBe(365);
	});
});
