import type { THijri, TGregorian, TJalali } from "src/types";
import { gregorianToJalali, jalaliToGregorian } from "..";

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

export const gregorianToHijri = ({ gy, gm, gd }: TGregorian): THijri => {
	const julday = gregorianToJulian(gy, gm, gd);
	return julianToHijri(julday);
};

export const hijriToGregorian = ({ hy, hm, hd }: THijri): TGregorian => {
	const julday = hijriToJulian(hy, hm, hd);
	return julianToGregorian(julday);
};

export function jalaliToHijri({ jy, jm, jd }: TJalali): THijri {
	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	return gregorianToHijri({ gy, gm, gd });
}

export function hijriToJalali({ hy, hm, hd }: THijri): TJalali {
	const { gy, gm, gd } = hijriToGregorian({ hy, hm, hd });
	return gregorianToJalali(gy, gm, gd);
}
