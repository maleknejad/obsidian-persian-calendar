import { App, TFile, MarkdownView } from "obsidian";
import type { TLocal, TPathTokenContext, TSetting } from "src/types";
import { jalaliToGregorian, jalaliMonthLength, jalaliToSeason } from "src/utils/dateUtils";
import { createNoteModal } from "src/components/ConfirmModal";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";

export default class NoteService {
	constructor(
		private readonly app: App,
		private readonly settings: TSetting,
	) {}
	private normalizeFolderPath(path?: string | null) {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	private resolvePathTokens(path: string, ctx?: TPathTokenContext, local: TLocal = "fa") {
		if (!ctx) return path;

		let result = path;
		const { jy, jm } = ctx;

		if (jy != null) {
			result = result.replace(/jYYYY/g, String(jy));
		}

		if (jm != null) {
			const monthName = JALALI_MONTHS_NAME[local][jm];

			result = result
				.replace(/jMMMM/g, monthName)
				.replace(/jMM/g, jm.toString().padStart(2, "0"))
				.replace(/jM/g, jm.toString());
		}

		let { season } = ctx;
		if (season == null && jm != null) {
			season = jalaliToSeason(jm);
		}

		if (season != null) {
			const seasonName = SEASONS_NAME["fa"][season];

			result = result
				.replace(/jQQQQ/g, seasonName)
				.replace(/jQQ/g, season.toString().padStart(2, "0"))
				.replace(/jQ/g, season.toString());
		}

		return result;
	}

	private buildNotePath(
		basePath: string | undefined,
		fileName: string,
		tokenContext?: TPathTokenContext,
		local: TLocal = "fa",
	) {
		const normalized = this.normalizeFolderPath(basePath);
		const resolved = this.resolvePathTokens(normalized, tokenContext, local);

		return resolved ? `${resolved}/${fileName}` : fileName;
	}

	private async ensureFolderExistsForPath(filePath: string) {
		const parts = filePath.split("/");
		parts.pop();

		const folderPath = parts.join("/");
		if (!folderPath) return;

		let currentPath = "";
		for (const part of parts) {
			if (!part) continue;

			currentPath = currentPath ? `${currentPath}/${part}` : part;

			const existing = this.app.vault.getAbstractFileByPath(currentPath);
			if (!existing) {
				await this.app.vault.createFolder(currentPath);
			}
		}
	}

	private async openNoteInWorkspace(noteFile: TFile) {
		const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");

		const existingLeaf = markdownLeaves.find(
			(leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile,
		);

		if (existingLeaf) {
			this.app.workspace.setActiveLeaf(existingLeaf);
			return;
		}

		await this.app.workspace.openLinkText(noteFile.path, "", false);
	}

	private async openOrCreateNoteWithConfirm(options: {
		filePath: string;
		confirmTitle: string;
		confirmMessage: string;
	}) {
		const { filePath, confirmTitle, confirmMessage } = options;

		try {
			let noteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (noteFile instanceof TFile) {
				await this.openNoteInWorkspace(noteFile);
				return;
			}

			if (this.settings.askForCreateNote) {
				const shouldCreate = await createNoteModal(this.app, {
					title: confirmTitle,
					message: confirmMessage,
				});

				if (!shouldCreate) {
					return;
				}
			}

			await this.ensureFolderExistsForPath(filePath);

			const createdFile = await this.app.vault.create(filePath, "");

			if (createdFile instanceof TFile) {
				await this.openNoteInWorkspace(createdFile);
			}
		} catch (error) {}
	}

	public async getWeeksWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.settings.weeklyNotesPath;
		const result: number[] = [];

		for (let weekNumber = 1; weekNumber <= 53; weekNumber++) {
			const fileName = `${jy}-W${weekNumber}.md`;
			const filePath = this.buildNotePath(notesLocation, fileName, { jy });

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(weekNumber);
			}
		}

		return result;
	}

	public async getSeasonsWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.settings.seasonalNotesPath;
		const result: number[] = [];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const fileName = `${jy}-S${seasonNumber}.md`;
			const filePath = this.buildNotePath(notesLocation, fileName, {
				jy,
				season: seasonNumber,
			});

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(seasonNumber);
			}
		}

		return result;
	}

	public async getDaysWithNotes(jy: number, jm: number): Promise<number[]> {
		const notesLocation = this.settings.dailyNotesPath;
		const result: number[] = [];
		const daysInMonth = jalaliMonthLength(jy, jm);

		for (let jd = 1; jd <= daysInMonth; jd++) {
			let fileName: string;

			if (this.settings.dateFormat === "gregorian") {
				const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
				fileName = `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}.md`;
			} else {
				fileName = `${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}.md`;
			}

			const filePath = this.buildNotePath(notesLocation, fileName, {
				jy,
				jm,
			});

			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (file instanceof TFile) {
				result.push(jd);
			}
		}

		return result;
	}

	public async openOrCreateDailyNote(jy: number, jm: number, jd: number) {
		let dateString = `${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}`;

		if (this.settings.dateFormat === "gregorian") {
			const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
			dateString = `${gy}-${gm.toString().padStart(2, "0")}-${gd.toString().padStart(2, "0")}`;
		}

		const notesLocation = this.settings.dailyNotesPath;
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`, {
			jy,
			jm,
		});

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد روزنوشت جدید",
			confirmMessage: `روزنوشت \u202A${dateString}\u202C ایجاد شود؟`,
		});
	}

	public async openOrCreateWeeklyNote(jy: number, weekNumber: number) {
		const fileName = `${jy}-W${weekNumber}.md`;
		const notesLocation = this.settings.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد هفته‌نوشت جدید",
			confirmMessage: `هفته‌نوشت هفته‌ی ${weekNumber}ام سال ${jy} ایجاد شود؟`,
		});
	}

	public async openOrCreateMonthlyNote(jy: number, jm: number, local: TLocal = "fa") {
		const fileName = `${jy}-${jm.toString().padStart(2, "0")}.md`;
		const notesLocation = this.settings.monthlyNotesPath;
		const filePath = this.buildNotePath(
			notesLocation,
			fileName,
			{
				jy,
				jm,
			},
			local,
		);

		const jMonthName = JALALI_MONTHS_NAME[local];

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد ماه‌نوشت جدید",
			confirmMessage: `ماه‌نوشت ${jMonthName[jm]} ${jy} ایجاد شود؟`,
		});
	}

	public async openOrCreateSeasonalNote(jy: number, seasonNumber: number, local: TLocal = "fa") {
		const fileName = `${jy}-S${seasonNumber}.md`;
		const notesLocation = this.settings.seasonalNotesPath;
		const filePath = this.buildNotePath(
			notesLocation,
			fileName,
			{
				jy,
				season: seasonNumber,
			},
			local,
		);

		const seasonsName = SEASONS_NAME[local];

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد فصل‌نوشت جدید",
			confirmMessage: `فصل‌نوشت ${seasonsName[seasonNumber]} ${jy} ایجاد شود؟`,
		});
	}

	public async openOrCreateYearlyNote(jy: number) {
		const fileName = `${jy}.md`;
		const notesLocation = this.settings.yearlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName, { jy });

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد سال‌نوشت جدید",
			confirmMessage: `سال‌نوشت ${jy} ایجاد شود؟`,
		});
	}
}
