import { App, TAbstractFile, TFile, TFolder, AbstractInputSuggest } from "obsidian";

export type PathSuggestMode = "folder" | "file" | "md-file";

export default class PathSuggest extends AbstractInputSuggest<TAbstractFile> {
	private inputEl: HTMLInputElement;
	private mode: PathSuggestMode;

	constructor(app: App, inputEl: HTMLInputElement, mode: PathSuggestMode = "folder") {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.mode = mode;
	}

	getSuggestions(query: string): TAbstractFile[] {
		const q = query.toLowerCase();

		return this.app.vault.getAllLoadedFiles().filter((file) => {
			if (this.mode === "folder" && !(file instanceof TFolder)) return false;
			if (this.mode === "file" && !(file instanceof TFile)) return false;
			if (this.mode === "md-file" && !(file instanceof TFile && file.extension === "md"))
				return false;

			return !q || file.path.toLowerCase().includes(q);
		});
	}

	renderSuggestion(file: TAbstractFile, el: HTMLElement) {
		el.setText(file.path);
	}

	selectSuggestion(file: TAbstractFile) {
		this.inputEl.value = file.path;
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
