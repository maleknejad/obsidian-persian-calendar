import type { App } from "obsidian";
import { AbstractInputSuggest } from "obsidian";
import type { TPathSuggestMode } from "src/types";

export class PathSuggest extends AbstractInputSuggest<string> {
	private readonly mode: TPathSuggestMode;
	private readonly inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement, mode: TPathSuggestMode = "folder") {
		super(app, inputEl);
		this.mode = mode;
		this.inputEl = inputEl;
	}

	async getSuggestions(query: string): Promise<string[]> {
		const lastSlash = query.lastIndexOf("/");
		const dirPath = lastSlash >= 0 ? query.substring(0, lastSlash) : "";
		const partial = query.substring(lastSlash + 1).toLowerCase();
		const isHidden = (p: string) => p.split("/").some((part) => part.startsWith("."));

		try {
			const listed = await this.app.vault.adapter.list(dirPath || "/");
			let entries: string[];

			if (this.mode === "folder") {
				entries = listed.folders;
			} else if (this.mode === "md-file") {
				entries = [...listed.folders, ...listed.files.filter((f) => f.endsWith(".md"))];
			} else {
				entries = [...listed.folders, ...listed.files];
			}

			return entries.filter((e) => !isHidden(e) && e.toLowerCase().includes(partial)).slice(0, 20);
		} catch {
			return [];
		}
	}

	renderSuggestion(path: string, el: HTMLElement): void {
		el.textContent = path;
	}

	selectSuggestion(path: string): void {
		this.setValue(path);
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}
