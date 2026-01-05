import type {
	GregorianType,
	NumberOfMonthsType,
	LocalType,
	WeekStartType,
	JalaliType,
} from "src/types";
import { JALALI_MONTHS } from "src/constants";

// Maps week start ("sat" | "sun" | "mon") to JS weekday number (0=Sun, 6=Sat)
export const weekStartNumber = (weekStart: WeekStartType): number =>
	({
		sat: 6,
		sun: 0,
		mon: 1,
	}[weekStart]);

// (Gregorian)Date => {gy, gm, gd}
export function dateToYMD(date: Date): GregorianType {
	if (isNaN(date.getTime())) {
		throw new Error('Invalid Date for "dateToYMD" function');
	}

	return {
		gy: date.getFullYear(),
		gm: date.getMonth() + 1,
		gd: date.getDate(),
	};
}

// 12 => اسفند
export function getJalaliMonthName(month: NumberOfMonthsType, local: "fa" | "en" = "fa"): string {
	return JALALI_MONTHS[local][month];
}

// (Gregorian)Date => weekday name(fa or en)
export function getDateToWeekdayName(date: Date, local: LocalType = "fa"): string {
	const locale = local === "fa" ? "fa-IR" : "en-US";

	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		timeZone: "Asia/Tehran",
	}).format(date);
}

// (gregorian)Date => "jy-jm-jd"
export function formatJalali(date: Date, local: "fa" | "en" = "en"): string {
	const locale = local === "fa" ? "fa-IR" : "en-US";

	const formatted = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		calendar: "persian",
		timeZone: "Asia/Tehran",
	}).format(date);

	// Replace slashes or dots with dash
	return formatted.replace(/[\/\.]/g, "-");
}

export function jalaliDashTojalali(dateStr: string): JalaliType | null {
	const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (!match) return null;

	const jy = +match[1];
	const jm = +match[2];
	const jd = +match[3];

	if (jy < 1000 || jy > 2000 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
		return null;
	}

	return { jy, jm, jd };
}

// (year, month, day) => "year-month-day"
export function dateToDash(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// (date, days) => (with days added)Date
export function addDayDate(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}
