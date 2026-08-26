import { DEFAULT_SETTING } from "src/constants";
import type PersianCalendarPlugin from "src/main";
import NotePathBuilder from "src/services/NotePathBuilder";
import type { TSetting } from "src/types";
import { clearCompiledPatternCache } from "src/utils/dateEngine/compiler";
import { DatePatternFormatError } from "src/utils/dateEngine/errors";
import { formatPattern } from "src/utils/dateEngine/formatter";

beforeEach(() => {
	clearCompiledPatternCache();
});

function createBuilder(settingOverrides: Partial<TSetting> = {}) {
	const plugin = {
		setting: { ...DEFAULT_SETTING, ...settingOverrides },
	} as unknown as PersianCalendarPlugin;

	return new NotePathBuilder(plugin);
}

describe("NotePathBuilder.buildEngineContext", () => {
	it("derives the Jalali season from a full Jalali date", () => {
		const builder = createBuilder();
		expect(builder.buildEngineContext({ jy: 1403, jm: 4, jd: 10 }).season).toBe(2);
	});

	it("derives the Jalali season from a full Gregorian date alone", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ gy: 2024, gm: 7, gd: 1 });
		expect(ctx.jy).toBeDefined();
		expect(ctx.jm).toBeDefined();
		expect(ctx.season).toBeDefined();
	});

	it("derives Gregorian fields from a full Jalali date", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ jy: 1403, jm: 1, jd: 1 });
		expect(ctx.gy).toBeDefined();
		expect(ctx.gm).toBeDefined();
		expect(ctx.gd).toBeDefined();
	});

	it("anchors to the season's first month/day when only the season is known", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({ jy: 1403, season: 3 });
		// Season 3 (Paeez) starts at Jalali month 7.
		expect(ctx.jm).toBe(7);
		expect(ctx.jd).toBe(1);
		expect(ctx.gy).toBeDefined();
	});

	it("leaves an already-complete context untouched", () => {
		const builder = createBuilder();
		const ctx = builder.buildEngineContext({
			jy: 1403,
			jm: 4,
			jd: 10,
			gy: 2024,
			gm: 7,
			gd: 1,
			season: 2,
		});
		expect(ctx).toEqual({
			jy: 1403,
			jm: 4,
			jd: 10,
			gy: 2024,
			gm: 7,
			gd: 1,
			season: 2,
			week: undefined,
		});
	});
});

describe("NotePathBuilder - mixed-calendar dynamic paths (regression)", () => {
	it("resolves YYYY/jQQ for the yearly note path instead of throwing", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves jYYYY/jQQ for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "jYYYY/jQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jQQQQ for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jQQQQ" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jMMMM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jMMMM" });
		const { filePath } = builder.buildYearlyNotePath(1403);
		expect(filePath).toContain("Farvardin");
	});

	it("resolves jYYYY/MM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "jYYYY/MM" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("resolves YYYY/jMM for the yearly note path", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/jMM" });
		const { filePath } = builder.buildYearlyNotePath(1403);
		expect(filePath).toMatch(/\d{4}\/01\//);
	});

	it("resolves YYYY/jQQ for the seasonal note path", () => {
		const builder = createBuilder({ seasonalNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildSeasonalNotePath(1403, 3)).not.toThrow();
	});

	it("resolves jYYYY/MM for the seasonal note path", () => {
		const builder = createBuilder({ seasonalNotesPath: "jYYYY/MM" });
		expect(() => builder.buildSeasonalNotePath(1403, 3)).not.toThrow();
	});

	it("still resolves purely Gregorian yearly paths", () => {
		const builder = createBuilder({ yearlyNotesPath: "YYYY/MM/DD" });
		expect(() => builder.buildYearlyNotePath(1403)).not.toThrow();
	});

	it("still resolves purely Jalali seasonal paths", () => {
		const builder = createBuilder({ seasonalNotesPath: "jYYYY/jQQQQ" });
		expect(() => builder.buildSeasonalNotePath(1403, 1)).not.toThrow();
	});

	it("still resolves the default daily/weekly/monthly note paths", () => {
		const builder = createBuilder();
		expect(() => builder.buildDailyNotePath(1403, 1, 1)).not.toThrow();
		expect(() => builder.buildWeeklyNotePath(1403, 1)).not.toThrow();
		expect(() => builder.buildMonthlyNotePath(1403, 1)).not.toThrow();
	});

	it("resolves mixed YYYY/jQQ for the monthly note path (full context already available)", () => {
		const builder = createBuilder({ monthlyNotesPath: "YYYY/jQQ" });
		expect(() => builder.buildMonthlyNotePath(1403, 4)).not.toThrow();
	});

	it("still throws a DatePatternFormatError when a field genuinely cannot be derived", () => {
		const builder = createBuilder();
		expect(() => formatPattern("jMM", builder.buildEngineContext({ jy: 1403 }))).toThrow(
			DatePatternFormatError,
		);
	});
});
