import { Modal, App, setIcon } from "obsidian";
import { SocialLinks } from "src/components/SocialLinks";
import type { TReleaseNote } from "src/types";

export class UpdateModal extends Modal {
	private notes: TReleaseNote[];
	private onCloseCallback?: () => void;

	constructor(app: App, notes: TReleaseNote[], onCloseCallback?: () => void) {
		super(app);
		this.notes = notes;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("persian-calendar");

		const headerEl = contentEl.createEl("span", { cls: "persian-calendar__update-header" });
		setIcon(headerEl, "calendar-heart");

		contentEl.createEl("h1", {
			text: "Persian Calendar",
			cls: "persian-calendar__update-header",
		});

		SocialLinks(contentEl);

		this.notes.forEach((note) => {
			const section = contentEl.createEl("div");

			const header = section.createEl("div");
			header.createEl("h3", {
				text: `نسخه ${note.version}`,
				cls: "persian-calendar__update-version",
			});

			if (note.changes && note.changes.length > 0) {
				const ul = section.createEl("ul");
				note.changes.forEach((change) => {
					ul.createEl("li", { text: change });
				});
			}
		});
	}

	onClose() {
		this.contentEl.empty();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}
}
