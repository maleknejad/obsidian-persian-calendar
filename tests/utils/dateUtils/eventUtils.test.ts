// TODO: improve this

import { describe, it, expect, beforeEach } from "vitest";
import { dateToEvents, dashToEvents, checkHoliday } from "src/utils/dateUtils/eventUtils";
import type { TEventObject, TShowEvents } from "src/types";

describe("eventUtils", () => {
	let showEventsOption: TShowEvents;
	let date: Date;
	let gregorianDash: string;
	let jalaliDash: string;
	let expectedEvents: Omit<TEventObject, "day" | "month">[];

	beforeEach(() => {
		showEventsOption = {
			showIRGovernmentEvents: true,
			showIRAncientEvents: true,
			showIRIslamEvents: true,
			showGlobalEvents: true,
		};

		date = new Date(2025, 7, 5);

		gregorianDash = "2025-07-04";
		jalaliDash = "1404-04-13";

		expectedEvents = [{ holiday: false, base: "IR Ancient", title: "تیرروز، جشن تیرگان" }];
	});

	it("dateToEvents", () => {
		const events = dateToEvents(date, showEventsOption);

		expect(events).toEqual(expectedEvents);
	});

	it("dashToEvents", () => {
		const events = dashToEvents(jalaliDash, "jalali", showEventsOption);

		expect(events).toEqual(expectedEvents);
	});

	it("checkHoliday", () => {
		const date1 = new Date(Date.UTC(2025, 7, 6));
		const date2 = new Date(Date.UTC(2026, 3, 21));

		expect(checkHoliday(date1)).toBe(true);
		expect(checkHoliday(date2)).toBe(true);
	});
});
