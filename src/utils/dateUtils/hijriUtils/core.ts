import { HIJRI_ANCHORS, HIJRI_MONTHS_LENGTH } from "src/constants";
import type { THijri, TGregorian, TSupportedHijriYear } from "src/types";

const HIJRI_MONTH_MAP: Map<number, Map<number, 29 | 30>> = buildHijriMonthMap(HIJRI_MONTHS_LENGTH);

function buildHijriMonthMap(
	raw: Record<number, readonly number[]>,
): Map<number, Map<number, 29 | 30>> {
	const monthMap = new Map<number, Map<number, 29 | 30>>();
	const years = Object.keys(raw).map(Number);
	const minYear = Math.min(...years);
	const maxYear = Math.max(...years);

	for (let hy = minYear - 20; hy <= maxYear + 20; hy++) {
		const monthSubMap = new Map<number, 29 | 30>();

		for (let hm = 1; hm <= 12; hm++) {
			let length: 29 | 30;

			const yearData = raw[hy as TSupportedHijriYear];
			if (yearData && hm <= yearData.length) {
				length = yearData[hm - 1] as 29 | 30;
			} else {
				length = computedMonthLength(hy, hm);
			}

			monthSubMap.set(hm, length);
		}

		monthMap.set(hy, monthSubMap);
	}

	return monthMap;
}

function isHijriLeapYear(hy: number): boolean {
	const y = ((hy - 1) % 30) + 1;
	return [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(y);
}

function computedMonthLength(hy: number, hm: number): 29 | 30 {
	if (hm === 12) return isHijriLeapYear(hy) ? 30 : 29;
	return hm % 2 === 1 ? 30 : 29;
}

function getMonthLength(hy: number, hm: number): 29 | 30 {
	const known = HIJRI_MONTH_MAP.get(hy)?.get(hm);
	if (known) return known;

	return computedMonthLength(hy, hm);
}

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

function pickNearestAnchorByJulian(jd: number) {
	let best = HIJRI_ANCHORS.first;
	let minDelta = Math.abs(
		jd - gregorianToJulian(best.gregorian.gy, best.gregorian.gm, best.gregorian.gd),
	);

	for (const a of [HIJRI_ANCHORS.last]) {
		const ajd = gregorianToJulian(a.gregorian.gy, a.gregorian.gm, a.gregorian.gd);
		const d = Math.abs(jd - ajd);
		if (d < minDelta) {
			best = a;
			minDelta = d;
		}
	}

	return best;
}

function pickNearestAnchorByHijri(hy: number, hm: number) {
	const first = HIJRI_ANCHORS.first;
	const last = HIJRI_ANCHORS.last;

	const d1 = Math.abs(hy - first.hijri.hy) * 12 + Math.abs(hm - first.hijri.hm);
	const d2 = Math.abs(hy - last.hijri.hy) * 12 + Math.abs(hm - last.hijri.hm);

	return d1 <= d2 ? first : last;
}

// === main functions ===
export function gregorianToHijri(gy: number, gm: number, gd: number): THijri {
	const jd = gregorianToJulian(gy, gm, gd);
	const anchor = pickNearestAnchorByJulian(jd);

	let { hy, hm, hd } = anchor.hijri;
	let ajd = gregorianToJulian(anchor.gregorian.gy, anchor.gregorian.gm, anchor.gregorian.gd);

	let delta = jd - ajd;

	while (delta !== 0) {
		if (delta > 0) {
			const ml = getMonthLength(hy, hm);
			const remaining = ml - hd;

			if (delta > remaining) {
				delta -= remaining + 1;
				hd = 1;
				hm++;
				if (hm > 12) {
					hm = 1;
					hy++;
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
					hm = 12;
					hy--;
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

export function hijriToGregorian(hy: number, hm: number, hd: number): TGregorian {
	const anchor = pickNearestAnchorByHijri(hy, hm);

	let jd = gregorianToJulian(anchor.gregorian.gy, anchor.gregorian.gm, anchor.gregorian.gd);

	let ay = anchor.hijri.hy;
	let am = anchor.hijri.hm;
	let ad = anchor.hijri.hd;

	let delta = 0;

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
}
