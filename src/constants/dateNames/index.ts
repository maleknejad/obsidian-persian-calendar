import type { TLocal, TNumberOfMonths, TNumberOfSeasons } from "src/types";

export const SEASONS_NAME: Record<TLocal, Record<TNumberOfSeasons, string>> = {
	fa: {
		1: "بهار",
		2: "تابستان",
		3: "پاییز",
		4: "زمستان",
	},
	en: {
		1: "Spring",
		2: "Summer",
		3: "Autumn",
		4: "Winter",
	},
} as const;

export const JALALI_MONTHS_NAME: Record<TLocal, Record<TNumberOfMonths, string>> = {
	fa: {
		1: "فروردین",
		2: "اردیبهشت",
		3: "خرداد",
		4: "تیر",
		5: "مرداد",
		6: "شهریور",
		7: "مهر",
		8: "آبان",
		9: "آذر",
		10: "دی",
		11: "بهمن",
		12: "اسفند",
	},
	en: {
		1: "Farvardin",
		2: "Ordibehesht",
		3: "Khordad",
		4: "Tir",
		5: "Mordad",
		6: "Shahrivar",
		7: "Mehr",
		8: "Aban",
		9: "Azar",
		10: "Dey",
		11: "Bahman",
		12: "Esfand",
	},
} as const;

export const GREGORIAN_MONTHS_NAME: Record<TLocal, Record<TNumberOfMonths, string>> = {
	fa: {
		1: "ژانویه",
		2: "فوریه",
		3: "مارس",
		4: "آوریل",
		5: "مه",
		6: "ژوئن",
		7: "جولای",
		8: "اوت",
		9: "سپتامبر",
		10: "اکتبر",
		11: "نوامبر",
		12: "دسامبر",
	},
	en: {
		1: "January",
		2: "February",
		3: "March",
		4: "April",
		5: "May",
		6: "June",
		7: "July",
		8: "August",
		9: "September",
		10: "October",
		11: "November",
		12: "December",
	},
} as const;

export const HIJRI_MONTHS_NAME: Record<TLocal, Record<TNumberOfMonths, string>> = {
	fa: {
		1: "محرم",
		2: "صفر",
		3: "ربیع‌الاول",
		4: "ربیع‌الثانی",
		5: "جمادی‌الاول",
		6: "جمادی‌الثانی",
		7: "رجب",
		8: "شعبان",
		9: "رمضان",
		10: "شوال",
		11: "ذی‌القعده",
		12: "ذی‌الحجّه ",
	},
	en: {
		1: "Muharram",
		2: "Safar",
		3: "Rabi' al-Awwal",
		4: "Rabi' al-Thani",
		5: "Jumada al-Awwal",
		6: "Jumada al-Thani",
		7: "Rajab",
		8: "Sha'ban",
		9: "Ramadan",
		10: "Shawwal",
		11: "Dhu al-Qi'dah",
		12: "Dhu al-Hijjah",
	},
} as const;

export const WEEKDAYS_NAME: Record<TLocal, Record<number, string>> = {
	fa: {
		1: "شنبه",
		2: "یکشنبه",
		3: "دوشنبه",
		4: "سه‌شنبه",
		5: "چهارشنبه",
		6: "پنج‌شنبه",
		7: "جمعه",
	},
	en: {
		1: "Saturday",
		2: "Sunday",
		3: "Monday",
		4: "Tuesday",
		5: "Wednesday",
		6: "Thursday",
		7: "Friday",
	},
} as const;
