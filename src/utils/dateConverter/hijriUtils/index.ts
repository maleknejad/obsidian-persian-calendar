import { dateToGregorian, gregorianToJalali, jalaliToGregorian } from "..";
import type { THijri, TGregorian, TJalali } from "src/types";
import {
	adjustGregorianToConfirmed,
	adjustHijriToConfirmed,
	gregorianToHijriApprox,
	hijriToGregorianApprox,
} from "./core";

export const dateToHijri = (date: Date): THijri => {
	const { gy, gm, gd } = dateToGregorian(date);
	const hijriApprox = gregorianToHijriApprox(gy, gm, gd);
	return adjustHijriToConfirmed(hijriApprox);
};

export const gregorianToHijri = (gy: number, gm: number, gd: number): THijri => {
	const hijriApprox = gregorianToHijriApprox(gy, gm, gd);
	return adjustHijriToConfirmed(hijriApprox);
};

export const hijriToGregorian = (hy: number, hm: number, hd: number): TGregorian => {
	const gregorianApprox = hijriToGregorianApprox(hy, hm, hd);
	return adjustGregorianToConfirmed(hy, hm, hd, gregorianApprox);
};

export const jalaliToHijri = (jy: number, jm: number, jd: number): THijri => {
	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	return gregorianToHijri(gy, gm, gd);
};

export const hijriToJalali = (hy: number, hm: number, hd: number): TJalali => {
	const { gy, gm, gd } = hijriToGregorian(hy, hm, hd);
	return gregorianToJalali(gy, gm, gd);
};
