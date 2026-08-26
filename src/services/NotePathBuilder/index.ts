import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import type { TLocale } from "src/types";
import type { TDateEngineContext } from "src/utils/dateEngine";
import { formatPattern } from "src/utils/dateEngine";
import {
	getWeekStartCalculator,
	gregorianToJalali,
	jalaliToGregorian,
	jalaliToSeason,
} from "src/utils/dateUtils";
import { toWeekFormat } from "src/utils/formatters";
import { mapJalaliMonthToGregorianLabel, mapJalaliYearToGregorianLabel } from "./gregorianNaming";

export default class NotePathBuilder {
	constructor(private readonly plugin: PersianCalendarPlugin) {}

	public normalizeFolderPath(path?: string | null) {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	public buildEngineContext(parts: TDateEngineContext): TDateEngineContext {
		let { gy, gm, gd, jy, jm, jd, week, season } = parts;

		if (jm === undefined && season !== undefined) {
			jm = 3 * (season - 1) + 1;
			jd ??= 1;
		}

		if (jy !== undefined && jm !== undefined && jd !== undefined) {
			if (gy === undefined || gm === undefined || gd === undefined) {
				const derived = jalaliToGregorian(jy, jm, jd);
				gy ??= derived.gy;
				gm ??= derived.gm;
				gd ??= derived.gd;
			}
		} else if (gy !== undefined && gm !== undefined && gd !== undefined) {
			const derived = gregorianToJalali(gy, gm, gd);
			jy ??= derived.jy;
			jm ??= derived.jm;
			jd ??= derived.jd;
		}

		if (season === undefined && jm !== undefined) {
			season = jalaliToSeason(jm);
		}

		return { gy, gm, gd, jy, jm, jd, week, season };
	}

	private resolveFolderPattern(path: string | undefined, context: TDateEngineContext) {
		const normalized = this.normalizeFolderPath(path);
		return normalized ? formatPattern(normalized, this.buildEngineContext(context)) : "";
	}

	public buildNotePath(
		basePath: string | undefined,
		fileName: string,
		tokenContext: TDateEngineContext,
	) {
		const resolved = this.resolveFolderPattern(basePath, tokenContext);

		return resolved ? `${resolved}/${fileName}` : fileName;
	}

	public buildDailyNoteFileName(jy: number, jm: number, jd: number) {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const context = this.buildEngineContext({ jy, jm, jd, gy, gm, gd });

		return formatPattern(this.plugin.setting.dailyNoteFormat, context);
	}

	public buildDailyNotePath(jy: number, jm: number, jd: number) {
		const dateString = this.buildDailyNoteFileName(jy, jm, jd);
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
		const notesLocation = this.plugin.setting.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
		});

		return { filePath, dateString };
	}

	public buildWeeklyNotePath(jy: number, weekNumber: number) {
		const calculator = getWeekStartCalculator(this.plugin.setting.weekCalculation);
		const { jy: jYear, jm, jd, gy, gm, gd } = calculator.getStartOfWeek(jy, weekNumber);
		const fileName = `${toWeekFormat(jy, weekNumber)}.md`;

		const notesLocation = this.plugin.setting.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy: jYear,
			jm,
			jd,
			gy,
			gm,
			gd,
		});

		return { filePath, fileName };
	}

	public buildMonthlyNotePath(jy: number, jm: number, local: TLocale = "fa") {
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);

		let fileName: string;

		if (this.plugin.setting.monthlyNoteNaming === "gregorian") {
			const { year, month } = mapJalaliMonthToGregorianLabel(jy, jm);
			fileName = `${formatPattern("YYYY-MM", { gy: year, gm: month })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY-jMM", { jy, jm })}.md`;
		}

		const notesLocation = this.plugin.setting.monthlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy, jm, gy, gm, gd });

		const jMonthName = JALALI_MONTHS_NAME[local][jm];

		return { filePath, fileName, jMonthName };
	}

	public buildSeasonalNotePath(jy: number, seasonNumber: number, local: TLocale = "fa") {
		const fileName = `${formatPattern("jYYYY-[S]jQ", {
			jy,
			season: seasonNumber,
		})}.md`;

		// Anchor to the season's first Jalali day so the folder pattern can
		// also resolve Gregorian (YYYY/MM/DD) or Jalali month/day tokens, not
		// only jYYYY/jQQ. See `buildEngineContext` for why this is required.
		const jm = 3 * (seasonNumber - 1) + 1;
		const jd = 1;
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);

		const notesLocation = this.plugin.setting.seasonalNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, {
			jy,
			jm,
			jd,
			gy,
			gm,
			gd,
			season: seasonNumber,
		});

		const seasonName = SEASONS_NAME[local][seasonNumber];

		return { filePath, fileName, seasonName };
	}

	public buildYearlyNotePath(jy: number) {
		// Anchor to Farvardin 1st (jm/jd = 1/1) so the folder pattern can also
		// resolve jMM/jQQ/MM/DD tokens, not only YYYY/jYYYY. See
		// `buildEngineContext` for why this is required.
		const jm = 1;
		const jd = 1;
		const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);

		let fileName: string;

		if (this.plugin.setting.yearlyNoteNaming === "gregorian") {
			const { year } = mapJalaliYearToGregorianLabel(jy);
			fileName = `${formatPattern("YYYY", { gy: year })}.md`;
		} else {
			fileName = `${formatPattern("jYYYY", { jy })}.md`;
		}

		const notesLocation = this.plugin.setting.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy, jm, jd, gy, gm, gd });

		return { filePath, fileName };
	}

	public buildDetectionPattern(): string | null {
		const folderPattern = this.normalizeFolderPath(this.plugin.setting.dailyNotesPath);

		const filePattern = this.plugin.setting.dailyNoteFormat;

		if (!filePattern) return null;

		return folderPattern ? `${folderPattern}/${filePattern}.md` : `${filePattern}.md`;
	}
}
