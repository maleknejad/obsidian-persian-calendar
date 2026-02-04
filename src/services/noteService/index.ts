import { App, TFile, MarkdownView } from "obsidian";
import type { TLocal, TSetting } from "src/types";
import { jalaliToGregorian, jalaliMonthLength } from "src/utils/dateUtils";
import { createNoteModal } from "src/components/ConfirmModal";
import { JALALI_MONTHS_NAME, SEASONS_NAME } from "src/constants";

export default class NoteService {
	constructor(
		private readonly app: App,
		private readonly settings: TSetting,
	) {}
	private normalizeFolderPath(path?: string | null): string {
		if (!path) return "";
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	private buildNotePath(basePath: string | undefined, fileName: string): string {
		const normalized = this.normalizeFolderPath(basePath);
		return normalized ? `${normalized}/${fileName}` : fileName;
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
			const filePath = this.buildNotePath(notesLocation, fileName);

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
			const filePath = this.buildNotePath(notesLocation, fileName);

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

			const filePath = this.buildNotePath(notesLocation, fileName);
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
		const filePath = this.buildNotePath(notesLocation, `${dateString}.md`);

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد روزنوشت جدید",
			confirmMessage: `روزنوشت \u202A${dateString}\u202C ایجاد شود؟`,
		});
	}

	public async openOrCreateWeeklyNote(jy: number, weekNumber: number) {
		const fileName = `${jy}-W${weekNumber}.md`;
		const notesLocation = this.settings.weeklyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName);

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد هفته‌نوشت جدید",
			confirmMessage: `هفته‌نوشت هفته‌ی ${weekNumber}ام سال ${jy} ایجاد شود؟`,
		});
	}

	public async openOrCreateMonthlyNote(jy: number, jm: number, local: TLocal = "fa") {
		const fileName = `${jy}-${jm.toString().padStart(2, "0")}.md`;
		const notesLocation = this.settings.monthlyNotesPath;
		const filePath = this.buildNotePath(notesLocation, fileName);

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
		const filePath = this.buildNotePath(notesLocation, fileName);

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
		const filePath = this.buildNotePath(notesLocation, fileName);

		await this.openOrCreateNoteWithConfirm({
			filePath,
			confirmTitle: "ایجاد سال‌نوشت جدید",
			confirmMessage: `سال‌نوشت ${jy} ایجاد شود؟`,
		});
	}
}
