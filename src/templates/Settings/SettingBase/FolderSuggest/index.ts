import { App, TFolder, AbstractInputSuggest } from "obsidian";

export default class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	getSuggestions(query: string): TFolder[] {
		const folders: TFolder[] = [];

		this.app.vault.getAllLoadedFiles().forEach((f) => {
			if (f instanceof TFolder) {
				if (!query) {
					folders.push(f);
				} else if (f.path.toLowerCase().includes(query.toLowerCase())) {
					folders.push(f);
				}
			}
		});

		return folders;
	}

	renderSuggestion(folder: TFolder, el: HTMLElement) {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder) {
		this.inputEl.value = folder.path;
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
