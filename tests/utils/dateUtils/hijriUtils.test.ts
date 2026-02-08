import { describe, it, expect } from "vitest";
import {
	dateToHijri,
	jalaliToHijri,
	hijriToJalali,
	gregorianToHijri,
	hijriToGregorian,
} from "src/utils/dateUtils/hijriUtils";

describe("hijriUtils", () => {
	it("dateToHijri", () => {
		const date = new Date("2026-01-01");
		const hijri = dateToHijri(date);

		expect(hijri.hy).toBe(1447);
		expect(hijri.hm).toBe(7);
		expect(hijri.hd).toBe(11);
	});

	it("jalaliToHijri", () => {
		const hijri = jalaliToHijri(1404, 12, 20);

		expect(hijri.hy).toBe(1447);
		expect(hijri.hm).toBe(9);
		expect(hijri.hd).toBe(21);
	});

	it("hijriToJalali", () => {
		const jalali = hijriToJalali(1447, 8, 16);

		expect(jalali.jy).toBe(1404);
		expect(jalali.jm).toBe(11);
		expect(jalali.jd).toBe(16);
	});

	it("gregorianToHijri", () => {
		const hijri = gregorianToHijri(2025, 4, 12);

		expect(hijri.hy).toBe(1446);
		expect(hijri.hm).toBe(10);
		expect(hijri.hd).toBe(13);
	});

	it("hijriToGregorian", () => {
		const gregorian = hijriToGregorian(1446, 10, 13);

		expect(gregorian.gy).toBe(2025);
		expect(gregorian.gm).toBe(4);
		expect(gregorian.gd).toBe(12);
	});
});
