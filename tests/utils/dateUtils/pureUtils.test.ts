import { describe, it, expect } from "vitest";
import { addDayDate } from "src/utils/dateUtils";

describe("addDays", () => {
	it("should add days correctly", () => {
		const base = new Date("2024-01-01");

		const result = addDayDate(base, 1).getDate();

		expect(result).toBe(2);
	});

	it("should not mutate original date", () => {
		const base = new Date("2024-01-01");

		const result = addDayDate(base, 5).getDate();
		expect(result).toBe(6);
	});
});
