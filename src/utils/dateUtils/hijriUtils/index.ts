import { dateToGregorian, gregorianToJalali, jalaliToGregorian } from "..";
import { gregorianToHijri, hijriToGregorian } from "./core";
import type { THijri, TJalali } from "src/types";

//? --- Main ---
export const dateToHijri = (date: Date): THijri => {
	const { gy, gm, gd } = dateToGregorian(date);
	return gregorianToHijri(gy, gm, gd);
};

export const jalaliToHijri = (jy: number, jm: number, jd: number): THijri => {
	const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
	return gregorianToHijri(gy, gm, gd);
};

export const hijriToJalali = (hy: number, hm: number, hd: number): TJalali => {
	const { gy, gm, gd } = hijriToGregorian(hy, hm, hd);
	return gregorianToJalali(gy, gm, gd);
};

export { gregorianToHijri, hijriToGregorian };
