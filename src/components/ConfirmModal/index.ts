import type { App } from "obsidian";
import { Modal } from "obsidian";
import { getDirection, t } from "src/languages";

class ConfirmModal extends Modal {
	private titleText: string;
	private messageText: string;
	private resolve!: (value: boolean) => void;

	constructor(app: App, titleText: string, messageText: string, resolve: (value: boolean) => void) {
		super(app);
		this.titleText = titleText;
		this.messageText = messageText;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.replaceChildren();

		this.modalEl.classList.add("persian-calendar");
		this.modalEl.setAttribute("dir", getDirection());

		const heading = document.createElement("h2");
		heading.textContent = this.titleText;
		contentEl.appendChild(heading);

		const message = document.createElement("p");
		message.textContent = this.messageText;
		contentEl.appendChild(message);

		const buttons = document.createElement("div");
		buttons.classList.add("persian-calendar__cmodal-container");
		contentEl.appendChild(buttons);

		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = t("modal.confirmModal.cancelBtn");
		cancelBtn.classList.add("persian-calendar__cmodal-cancel");
		buttons.appendChild(cancelBtn);

		const confirmBtn = document.createElement("button");
		confirmBtn.textContent = t("modal.confirmModal.confirmBtn");
		confirmBtn.classList.add("persian-calendar__cmodal-confirm");
		buttons.appendChild(confirmBtn);

		confirmBtn.onclick = () => {
			this.resolve(true);
			this.close();
		};

		cancelBtn.onclick = () => {
			this.resolve(false);
			this.close();
		};
	}

	onClose() {
		this.contentEl.replaceChildren();
	}
}

export default function createNoteModal(
	app: App,
	options?: { title?: string; message?: string },
): Promise<boolean> {
	const title = options?.title ?? t("modal.confirmModal.title");
	const message = options?.message ?? t("modal.confirmModal.message");

	return new Promise((resolve) => {
		new ConfirmModal(app, title, message, resolve).open();
	});
}
