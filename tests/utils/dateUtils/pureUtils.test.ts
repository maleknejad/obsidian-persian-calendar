import { describe, it, expect } from "vitest";
import {
	gregorianToDate,
	weekStartNumber,
	dateToGregorian,
	dateToWeekdayName,
	addDayDate,
	jalaliToSeason,
} from "src/utils/dateUtils/pureUtils";

describe("pureUtils", () => {
	it("gregorianToDate", () => {
		expect(gregorianToDate(2026, 2, 28)?.toString()).toBe(new Date("2026-02-28").toString());
		expect(gregorianToDate(2026, 2, 30)).toBeNull();
	});

	it("weekStartNumber", () => {
		expect(weekStartNumber("sat")).toBe(6);
		expect(weekStartNumber("sun")).toBe(0);
	});

	it("dateToGregorian", () => {
		const d = new Date(Date.UTC(2024, 0, 1));
		expect(dateToGregorian(d)).toEqual({ gy: 2024, gm: 1, gd: 1 });
	});

	it("dateToWeekdayName", () => {
		const d = new Date(Date.UTC(2026, 1, 4));
		expect(dateToWeekdayName(d)).toBe("چهارشنبه");
	});

	it("addDayDate", () => {
		const d = new Date(Date.UTC(2024, 0, 1));
		const d2 = addDayDate(d, 10);

		expect(d2.getUTCDate()).toBe(11);
	});

	it("jalaliToSeason", () => {
		expect(jalaliToSeason(1)).toBe(1);
		expect(jalaliToSeason(4)).toBe(2);
		expect(jalaliToSeason(7)).toBe(3);
		expect(jalaliToSeason(10)).toBe(4);
	});
});
