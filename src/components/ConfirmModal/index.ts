import { App, Modal } from "obsidian";

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
		contentEl.empty();
		contentEl.addClass("persian-calendar");

		contentEl.createEl("h2", { text: this.titleText });

		contentEl.createEl("p", { text: this.messageText });

		const buttons = contentEl.createDiv({ cls: "persian-calendar__cmodal-container" });

		const cancelBtn = buttons.createEl("button", {
			text: "انصراف",
			cls: "persian-calendar__cmodal-cancel",
		});
		const confirmBtn = buttons.createEl("button", {
			text: "تایید",
			cls: "persian-calendar__cmodal-confirm",
		});

		confirmBtn.addEventListener("click", () => {
			this.resolve(true);
			this.close();
		});

		cancelBtn.addEventListener("click", () => {
			this.resolve(false);
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}

export function createNoteModal(
	app: App,
	options: { title: string; message: string },
): Promise<boolean> {
	const { title = "تایید ایجاد یادداشت", message = "آیا می‌خواهید این یادداشت ایجاد شود؟" } =
		options;

	return new Promise((resolve) => {
		new ConfirmModal(app, title, message, resolve).open();
	});
}
