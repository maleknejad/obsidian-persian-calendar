import { IRHIJRI_MONTHS_BY_YEAR } from "src/constants";
import type { THijri, TGregorian } from "src/types";

const hijriToJulian = (year: number, month: number, day: number): number =>
	Math.floor((11 * year + 3) / 30) +
	354 * year +
	30 * month -
	Math.floor((month - 1) / 2) +
	day +
	1948440 -
	386;

const gregorianToJulian = (year: number, month: number, day: number): number => {
	if (month < 3) {
		year -= 1;
		month += 12;
	}

	const a = Math.floor(year / 100);
	const b =
		year === 1582 && (month > 10 || (month === 10 && day > 4))
			? -10
			: year > 1582
			? 2 - a + Math.floor(a / 4)
			: 0;

	return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524;
};

const julianToHijri = (julianDay: number): THijri => {
	const cycleDays = 10631;
	const yearDays = 10631 / 30;
	const epoch = 1948084;
	const shift = 8.01 / 60;

	let z = julianDay - epoch;
	const cycle = Math.floor(z / cycleDays);
	z -= cycle * cycleDays;

	const yearInCycle = Math.floor((z - shift) / yearDays);
	z -= Math.floor(yearInCycle * yearDays + shift);

	const hm = Math.min(12, Math.floor((z + 28.5001) / 29.5));
	const hd = z - Math.floor(29.5001 * hm - 29);

	return {
		hy: cycle * 30 + yearInCycle,
		hm,
		hd,
	};
};

const julianToGregorian = (julianDay: number): TGregorian => {
	let b = 0;

	if (julianDay > 2299160) {
		const a = Math.floor((julianDay - 1867216.25) / 36524.25);
		b = 1 + a - Math.floor(a / 4);
	}

	const julday = julianDay + b + 1524;
	let c = Math.floor((julday - 122.1) / 365.25);
	const d = Math.floor(365.25 * c);
	const e = Math.floor((julday - d) / 30.6001);

	const gd = julday - d - Math.floor(30.6001 * e);
	const gm = e > 13 ? e - 13 : e - 1;
	const gy = gm > 2 ? c - 4716 : c - 4715;

	return { gy, gm, gd };
};

// main functions

export const gregorianToHijriApprox = (gy: number, gm: number, gd: number): THijri => {
	const julday = gregorianToJulian(gy, gm, gd);
	return julianToHijri(julday);
};

const isSupportedIranHijriYear = (hy: number): boolean => {
	const confirmedYears = Object.keys(IRHIJRI_MONTHS_BY_YEAR).map(Number);
	return hy >= Math.min(...confirmedYears) && hy <= Math.max(...confirmedYears);
};

export const hijriToGregorianApprox = (hy: number, hm: number, hd: number): TGregorian => {
	const julday = hijriToJulian(hy, hm, hd);
	return julianToGregorian(julday);
};

const calculateHijriMonthLength = (hy: number, hm: number): number => {
	const firstDayCurrent = hijriToGregorianApprox(hy, hm, 1);

	let firstDayNext: TGregorian;
	if (hm === 12) {
		firstDayNext = hijriToGregorianApprox(hy + 1, 1, 1);
	} else {
		firstDayNext = hijriToGregorianApprox(hy, hm + 1, 1);
	}

	const julianCurrent = gregorianToJulian(
		firstDayCurrent.gy,
		firstDayCurrent.gm,
		firstDayCurrent.gd,
	);

	const julianNext = gregorianToJulian(firstDayNext.gy, firstDayNext.gm, firstDayNext.gd);

	return julianNext - julianCurrent;
};

const getHijriMonthLength = (hy: number, hm: number): number => {
	const monthIndex = 12 - hm;

	if (isSupportedIranHijriYear(hy)) {
		const months = IRHIJRI_MONTHS_BY_YEAR[hy as keyof typeof IRHIJRI_MONTHS_BY_YEAR];
		if (months && monthIndex >= 0 && monthIndex < months.length) {
			return months[monthIndex];
		}
	}

	return calculateHijriMonthLength(hy, hm);
};

export const adjustHijriToConfirmed = (hijriApprox: THijri): THijri => {
	const { hy, hm, hd } = hijriApprox;

	if (!isSupportedIranHijriYear(hy)) {
		return hijriApprox;
	}

	const monthLength = getHijriMonthLength(hy, hm);

	if (hd <= monthLength) {
		return { hy, hm, hd };
	}

	let newHd = hd;
	let newHm = hm;
	let newHy = hy;

	while (newHd > getHijriMonthLength(newHy, newHm)) {
		newHd -= getHijriMonthLength(newHy, newHm);
		newHm++;
		if (newHm > 12) {
			newHm = 1;
			newHy++;
		}
	}

	return { hy: newHy, hm: newHm, hd: newHd };
};

export const adjustGregorianToConfirmed = (
	hy: number,
	hm: number,
	hd: number,
	gregorianApprox: TGregorian,
): TGregorian => {
	if (!isSupportedIranHijriYear(hy)) {
		return gregorianApprox;
	}

	const firstDayOfMonth = hijriToGregorianApprox(hy, hm, 1);
	const julianFirst = gregorianToJulian(firstDayOfMonth.gy, firstDayOfMonth.gm, firstDayOfMonth.gd);
	const targetJulian = julianFirst + hd - 1;
	return julianToGregorian(targetJulian);
};
