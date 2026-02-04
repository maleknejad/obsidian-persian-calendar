import { IRAN_HIJRI_ANCHORS, IRAN_HIJRI_MONTHS_LENGTH } from "src/constants";
import type { THijri, TGregorian, TSupportedHijriYear } from "src/types";

function gregorianToJulian(year: number, month: number, day: number): number {
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
}

function julianToGregorian(julianDay: number): TGregorian {
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
}

function extrapolateMonthLength(prevLength: 29 | 30): 29 | 30 {
	return prevLength === 29 ? 30 : 29;
}

function getPreviousMonth(hy: number, hm: number) {
	if (hm === 1) {
		return { hy: hy - 1, hm: 12 };
	} else {
		return { hy, hm: hm - 1 };
	}
}

function getMonthLength(hy: number, hm: number): number {
	const yearData = IRAN_HIJRI_MONTHS_LENGTH[hy as TSupportedHijriYear];

	if (yearData && hm <= yearData.length) {
		return Number(yearData[hm - 1]);
	}

	const prev = getPreviousMonth(hy, hm);
	const prevLength = getMonthLength(prev.hy, prev.hm);
	return extrapolateMonthLength(prevLength as 29 | 30);
}

function pickBestAnchorByJulDay(JulDay: number) {
	let closestAnchor = IRAN_HIJRI_ANCHORS[0];
	let minDelta = Math.abs(
		JulDay -
			gregorianToJulian(
				closestAnchor.gregorian.gy,
				closestAnchor.gregorian.gm,
				closestAnchor.gregorian.gd,
			),
	);

	for (let i = 1; i < IRAN_HIJRI_ANCHORS.length; i++) {
		const a = IRAN_HIJRI_ANCHORS[i];
		const delta = Math.abs(
			JulDay - gregorianToJulian(a.gregorian.gy, a.gregorian.gm, a.gregorian.gd),
		);

		if (delta < minDelta) {
			closestAnchor = a as typeof closestAnchor;
			minDelta = delta;
		}
	}

	return closestAnchor;
}

function pickBestAnchorByHijri(hy: number, hm: number) {
	let closest = IRAN_HIJRI_ANCHORS[0];
	let minDelta = Math.abs(hy - closest.hijri.hy) * 12 + Math.abs(hm - closest.hijri.hm);

	for (let i = 1; i < IRAN_HIJRI_ANCHORS.length; i++) {
		const a = IRAN_HIJRI_ANCHORS[i];
		const delta = Math.abs(hy - a.hijri.hy) * 12 + Math.abs(hm - a.hijri.hm);
		if (delta < minDelta) {
			closest = a as typeof closest;
			minDelta = delta;
		}
	}

	return closest;
}

// === main functions ===
export function gregorianToHijri(gy: number, gm: number, gd: number): THijri {
	const julDay = gregorianToJulian(gy, gm, gd);

	const { gregorian, hijri } = pickBestAnchorByJulDay(julDay);
	let { hy, hm, hd }: THijri = hijri;

	const anchorJD = gregorianToJulian(gregorian.gy, gregorian.gm, gregorian.gd);

	let delta = julDay - anchorJD;

	while (delta !== 0) {
		if (delta > 0) {
			const monthLength = getMonthLength(hy, hm);
			if (delta >= monthLength - hd + 1) {
				delta -= monthLength - hd + 1;
				hd = 1;
				hm++;
				if (hm > 12) {
					hy++;
					hm = 1;
				}
			} else {
				hd += delta;
				delta = 0;
			}
		} else {
			if (-delta >= hd) {
				delta += hd;
				hm--;
				if (hm < 1) {
					hy--;
					hm = 12;
				}
				hd = getMonthLength(hy, hm);
			} else {
				hd += delta;
				delta = 0;
			}
		}
	}

	return { hy, hm, hd };
}

export const hijriToGregorian = (hy: number, hm: number, hd: number): TGregorian => {
	const { hijri, gregorian } = pickBestAnchorByHijri(hy, hm);
	let jd = gregorianToJulian(gregorian.gy, gregorian.gm, gregorian.gd);

	let delta = 0;
	let ay: number = hijri.hy;
	let am: number = hijri.hm;
	let ad: number = hijri.hd;

	if (hy > ay || (hy === ay && hm > am) || (hy === ay && hm === am && hd > ad)) {
		while (ay < hy || (ay === hy && am < hm)) {
			delta += getMonthLength(ay, am) - ad + 1;
			ad = 1;
			am++;
			if (am > 12) {
				am = 1;
				ay++;
			}
		}
		delta += hd - ad;
	} else {
		while (ay > hy || (ay === hy && am > hm)) {
			am--;
			if (am < 1) {
				am = 12;
				ay--;
			}
			delta -= getMonthLength(ay, am);
		}
		delta += hd - ad;
	}

	jd += delta;

	return julianToGregorian(jd);
};
