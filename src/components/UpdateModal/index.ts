import type { App } from "obsidian";
import { Modal, setIcon } from "obsidian";
import { SocialLinks } from "src/components";
import { RELEASE_NOTES } from "src/constants/releaseNotes";
import type { TReleaseNote, TSetting } from "src/types";

export default class UpdateModal extends Modal {
	private notes: TReleaseNote[];
	private setting: TSetting;
	private onCloseCallback?: () => void;

	constructor(app: App, setting: TSetting, notes?: TReleaseNote[], onCloseCallback?: () => void) {
		super(app);
		this.setting = setting;
		this.notes = notes ?? RELEASE_NOTES;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.replaceChildren();
		contentEl.classList.add("persian-calendar");
		contentEl.setAttribute("dir", this.setting.language === "fa" ? "rtl" : "ltr");

		const headerEl = document.createElement("div");
		headerEl.classList.add("persian-calendar__update-header");
		contentEl.appendChild(headerEl);
		setIcon(headerEl, "calendar-heart");

		const pluginName = "Persian Calendar";
		const nameEl = document.createElement("p");
		nameEl.textContent = pluginName;
		headerEl.appendChild(nameEl);

		SocialLinks(contentEl);

		this.notes.forEach((note) => {
			const section = document.createElement("div");
			contentEl.appendChild(section);

			const header = document.createElement("div");
			section.appendChild(header);

			const versionText =
				this.setting.language === "fa" ? `نسخه ${note.version}` : `Version ${note.version}`;
			const versionEl = document.createElement("h3");
			versionEl.textContent = versionText;
			versionEl.classList.add("persian-calendar__update-version");
			header.appendChild(versionEl);

			const changesArray = note.changes[this.setting.language];
			if (changesArray.length > 0) {
				const changesContainer = document.createElement("div");
				changesContainer.classList.add("persian-calendar__update-body");
				section.appendChild(changesContainer);

				changesArray.forEach((change) => {
					const changeEl = document.createElement("p");
					changeEl.textContent = change;
					changeEl.classList.add("persian-calendar__update-change");
					changesContainer.appendChild(changeEl);
				});
			}
		});
	}

	onClose() {
		this.contentEl.replaceChildren();
		if (this.onCloseCallback) {
			this.onCloseCallback();
		}
	}
}
