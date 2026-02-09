// todo: improve this

import { describe, it, expect } from "vitest";
import {
	gregorianDashToJalaliDash,
	jalaliDashToGregorianDash,
	dashToDate,
} from "src/utils/dateUtils";

describe("dashUtils", () => {
	it("gregorianDashToJalaliDash", () => {
		expect(gregorianDashToJalaliDash("2024-03-20")).toBe("1403-01-01");
	});

	it("jalaliDashToGregorianDash", () => {
		expect(jalaliDashToGregorianDash("1403-01-01")).toBe("2024-03-20");
	});

	it("dashToDate", () => {
		const d = dashToDate("1403-01-01", "jalali");
		expect(d?.getUTCFullYear()).toBe(2024);
	});
});
