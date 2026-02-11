import { JALALI_EVENTS, HIJRI_EVENTS, GREGORIAN_EVENTS } from "src/constants";
import type {
	TMonthMap,
	TEventObject,
	TDateFormat,
	TShowEvents,
	TEventObjectWithoutDate,
} from "src/types";
import { dashToDate, dateToGregorian, dateToHijri, dateToJalali } from "..";

const JALALI_EVENT_MAP: TMonthMap = buildEventMap(JALALI_EVENTS);
const HIJRI_EVENT_MAP: TMonthMap = buildEventMap(HIJRI_EVENTS);
const GREGORIAN_EVENT_MAP: TMonthMap = buildEventMap(GREGORIAN_EVENTS);

function buildEventMap(events: TEventObject[]): TMonthMap {
	const monthMap: TMonthMap = new Map();

	for (const event of events) {
		if (!monthMap.has(event.month)) {
			monthMap.set(event.month, new Map());
		}

		const dayMap = monthMap.get(event.month)!;

		if (!dayMap.has(event.day)) {
			dayMap.set(event.day, []);
		}

		dayMap.get(event.day)!.push(event);
	}

	return monthMap;
}

export function dateToEvents(date: Date, option: TShowEvents = {}): TEventObjectWithoutDate[] {
	const {
		showIRGovernmentEvents = false,
		showIRAncientEvents = false,
		showIRIslamEvents = false,
		showGlobalEvents = false,
	} = option;

	const { jm, jd } = dateToJalali(date);
	const { gm, gd } = dateToGregorian(date);
	const { hm, hd } = dateToHijri(date);

	const jalaliEventsRaw = JALALI_EVENT_MAP.get(jm)?.get(jd) ?? [];
	const gregorianEventsRaw = GREGORIAN_EVENT_MAP.get(gm)?.get(gd) ?? [];
	const hijriEventsRaw = HIJRI_EVENT_MAP.get(hm)?.get(hd) ?? [];

	const jalaliEvents = jalaliEventsRaw.filter((event) => {
		if (event.base === "IR Government") return showIRGovernmentEvents;
		if (event.base === "IR Ancient") return showIRAncientEvents;
		return false;
	});

	const gregorianEvents = gregorianEventsRaw.filter(
		(event) => event.base === "Global" && showGlobalEvents,
	);

	const hijriEvents = hijriEventsRaw.filter(
		(event) => event.base === "IR Islam" && showIRIslamEvents,
	);

	const events = [];
	events.push(...jalaliEvents, ...gregorianEvents, ...hijriEvents);

	return events.map(({ month, day, ...rest }: TEventObject) => rest);
}

export function checkHoliday(date: Date): boolean {
	// برای چک کردن تعطیلی، لازمه همه‌اشون بررسی بشه
	const option = {
		showIRGovernmentEvents: true,
		showIRAncientEvents: true,
		showIRIslamEvents: true,
		showGlobalEvents: true,
	};

	const events = dateToEvents(date, option);
	return events.some((event) => event.holiday === true);
}

export function dashToEvents(
	dashDate: string,
	dateFormat: TDateFormat,
	option: TShowEvents,
): TEventObjectWithoutDate[] | null {
	const date = dashToDate(dashDate, dateFormat);
	if (!date) return null;

	return dateToEvents(date, option);
}

export function eventsToString(events: TEventObjectWithoutDate[] | null) {
	if (!events) {
		return "هیچ مناسبتی برای این روز ثبت نشده است.";
	}

	return events.map(({ title, holiday }) => "- " + title + (holiday ? " (تعطیل)" : "")).join("\n");
}
