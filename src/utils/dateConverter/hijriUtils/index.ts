const hijriToJulian = (year: number, month: number, day: number): number => {
	return (
		Math.floor((11 * year + 3) / 30) +
		Math.floor(354 * year) +
		Math.floor(30 * month) -
		Math.floor((month - 1) / 2) +
		day +
		1948440 -
		386
	);
};

const gregorianToJulian = (year: number, month: number, day: number): number => {
	if (month < 3) {
		year -= 1;
		month += 12;
	}

	const a = Math.floor(year / 100.0);
	const b =
		year === 1582 && (month > 10 || (month === 10 && day > 4))
			? -10
			: year === 1582 && month === 10
			? 0
			: year < 1583
			? 0
			: 2 - a + Math.floor(a / 4.0);

	return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524;
};

interface HijriDate {
	year: number;
	month: number;
	day: number;
}

const julianToHijri = (julianDay: number): HijriDate => {
	const y = 10631.0 / 30.0;
	const epochAstro = 1948084;
	const shift1 = 8.01 / 60.0;

	let z = julianDay - epochAstro;
	const cyc = Math.floor(z / 10631.0);
	z -= 10631 * cyc;
	const j = Math.floor((z - shift1) / y);
	z -= Math.floor(j * y + shift1);

	const year = 30 * cyc + j;
	let month = Math.floor(parseInt(String((z + 28.5001) / 29.5)));
	if (month === 13) {
		month = 12;
	}

	const day = z - Math.floor(29.5001 * month - 29);

	return {
		year: parseInt(String(year)),
		month: parseInt(String(month)),
		day: parseInt(String(day)),
	};
};

interface GregorianDate {
	year: number;
	month: number;
	day: number;
}

const julianToGregorian = (julianDate: number): GregorianDate => {
	let b = 0;
	if (julianDate > 2299160) {
		const a = Math.floor((julianDate - 1867216.25) / 36524.25);
		b = 1 + a - Math.floor(a / 4.0);
	}

	const bb = julianDate + b + 1524;
	let cc = Math.floor((bb - 122.1) / 365.25);
	const dd = Math.floor(365.25 * cc);
	const ee = Math.floor((bb - dd) / 30.6001);

	const day = bb - dd - Math.floor(30.6001 * ee);
	let month = ee - 1;

	if (ee > 13) {
		cc += 1;
		month = ee - 13;
	}

	const year = cc - 4716;

	return {
		year: parseInt(String(year)),
		month: parseInt(String(month)),
		day: parseInt(String(day)),
	};
};

export { hijriToJulian, gregorianToJulian, julianToHijri, julianToGregorian };
export type { HijriDate, GregorianDate };
