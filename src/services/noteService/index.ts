import { App, Notice, TFile, MarkdownView } from "obsidian";
import type { TPluginSetting } from "src/types";
import { jalaliToGregorian, jalaliMonthLength } from "src/utils/dateUtils";

export default class NoteService {
	constructor(
		private readonly app: App,
		private readonly settings: TPluginSetting,
	) {}

	private normalizeFolderPath(path: string): string {
		return path.trim().replace(/^\/*|\/*$/g, "");
	}

	// todo: change this
	public async getDaysWithNotes(jy: number, jm: number): Promise<number[]> {
		const notesLocation = this.normalizeFolderPath(this.settings.dailyNotesPath);
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

			const filePath = notesLocation ? `${notesLocation}/${fileName}` : fileName;
			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (file instanceof TFile) {
				result.push(jd);
			}
		}

		return result;
	}

	public async getWeeksWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.normalizeFolderPath(this.settings.weeklyNotesPath);
		const result: number[] = [];

		for (let weekNumber = 1; weekNumber <= 53; weekNumber++) {
			const fileName = `${jy}-W${weekNumber}.md`;
			const filePath = notesLocation ? `${notesLocation}/${fileName}` : fileName;

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(weekNumber);
			}
		}

		return result;
	}

	public async getSeasensWithNotes(jy: number): Promise<number[]> {
		const notesLocation = this.normalizeFolderPath(this.settings.seasonalNotesPath);
		const result: number[] = [];

		for (let seasonNumber = 1; seasonNumber <= 4; seasonNumber++) {
			const fileName = `${jy}-S${seasonNumber}.md`;
			const filePath = notesLocation ? `${notesLocation}/${fileName}` : fileName;

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				result.push(seasonNumber);
			}
		}

		return result;
	}

	private async openNoteInWorkspace(noteFile: TFile) {
		const isOpen = this.app.workspace
			.getLeavesOfType("markdown")
			.some((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);

		if (isOpen) {
			const leaf = this.app.workspace
				.getLeavesOfType("markdown")
				.find((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);
			if (leaf) {
				this.app.workspace.setActiveLeaf(leaf);
			}
		} else {
			await this.app.workspace.openLinkText(noteFile.path, "", false);
		}
	}

	// todo: change this
	public async openOrCreateDailyNote(jy: number, jm: number, jd: number) {
		let dateString = `${jy}-${jm.toString().padStart(2, "0")}-${jd.toString().padStart(2, "0")}`;

		if (this.settings.dateFormat === "gregorian") {
			const g = jalaliToGregorian(jy, jm, jd);
			dateString = `${g.gy}-${g.gm.toString().padStart(2, "0")}-${g.gd
				.toString()
				.padStart(2, "0")}`;
		}

		const notesLocation = this.normalizeFolderPath(this.settings.dailyNotesPath);
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${dateString}.md`;

		try {
			let dailyNoteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (!dailyNoteFile) {
				await this.app.vault.create(filePath, "");
				dailyNoteFile = this.app.vault.getAbstractFileByPath(filePath);
			}

			if (dailyNoteFile && dailyNoteFile instanceof TFile) {
				await this.openNoteInWorkspace(dailyNoteFile);
			}
		} catch (error) {
			new Notice("Error creating/opening daily note");
		}
	}

	// todo: change this
	public async openOrCreateWeeklyNote(weekNumber: number, jy: number) {
		const weekString = `${jy}-W${weekNumber}`;
		const notesLocation = this.normalizeFolderPath(this.settings.weeklyNotesPath);
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${weekString}.md`;

		try {
			let weeklyNoteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (!weeklyNoteFile) {
				await this.app.vault.create(filePath, "");
				weeklyNoteFile = this.app.vault.getAbstractFileByPath(filePath);
			}

			if (weeklyNoteFile && weeklyNoteFile instanceof TFile) {
				await this.openNoteInWorkspace(weeklyNoteFile);
			}
		} catch (error) {
			new Notice("Error creating/opening weekly note");
		}
	}

	// todo: change this
	public async openOrCreateMonthlyNote(month: number, jy: number) {
		const monthString = `${jy}-${month.toString().padStart(2, "0")}`;
		const notesLocation = this.normalizeFolderPath(this.settings.monthlyNotesPath);
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${monthString}.md`;

		try {
			let monthlyNoteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (!monthlyNoteFile) {
				await this.app.vault.create(filePath, "");
				monthlyNoteFile = this.app.vault.getAbstractFileByPath(filePath);
			}

			if (monthlyNoteFile && monthlyNoteFile instanceof TFile) {
				await this.openNoteInWorkspace(monthlyNoteFile);
			}
		} catch (error) {
			new Notice("Error creating/opening monthly note");
		}
	}

	// todo: change this
	public async openOrCreateSeasonalNote(seasonNumber: number, jy: number) {
		const seasonString = `${jy}-S${seasonNumber}`;
		const notesLocation = this.normalizeFolderPath(this.settings.seasonalNotesPath);
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${seasonString}.md`;

		try {
			let seasonalNoteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (!seasonalNoteFile) {
				await this.app.vault.create(filePath, "");
				seasonalNoteFile = this.app.vault.getAbstractFileByPath(filePath);
			}

			if (seasonalNoteFile && seasonalNoteFile instanceof TFile) {
				await this.openNoteInWorkspace(seasonalNoteFile);
			}
		} catch (error) {
			new Notice("Error creating/opening seasonal note");
		}
	}

	// todo: change this
	public async openOrCreateYearlyNote(jy: number) {
		const yearString = String(jy);
		const notesLocation = this.normalizeFolderPath(this.settings.yearlyNotesPath);
		const filePath = `${notesLocation === "" ? "" : notesLocation + "/"}${yearString}.md`;

		try {
			let yearlyNoteFile = this.app.vault.getAbstractFileByPath(filePath);

			if (!yearlyNoteFile) {
				await this.app.vault.create(filePath, "");
				yearlyNoteFile = this.app.vault.getAbstractFileByPath(filePath);
			}

			if (yearlyNoteFile && yearlyNoteFile instanceof TFile) {
				await this.openNoteInWorkspace(yearlyNoteFile);
			}
		} catch (error) {
			new Notice("Error creating/opening yearly note");
		}
	}
}
