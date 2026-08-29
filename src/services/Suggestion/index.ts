import type { App, Editor, EditorPosition, EditorSuggestContext } from "obsidian";
import { EditorSuggest, TFile } from "obsidian";
import type { TSuggestProvider } from "src/types";

export default class Suggestion extends EditorSuggest<string> {
	providers: TSuggestProvider[];

	private activeProvider: TSuggestProvider | null = null;
	private lastContext: EditorSuggestContext | null = null;

	constructor(app: App, providers: TSuggestProvider[]) {
		super(app);
		this.providers = providers;
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		const container = document.createElement("div");
		el.appendChild(container);

		const inner = document.createElement("div");
		inner.textContent = value;
		container.appendChild(inner);
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestContext | null {
		const line = editor.getLine(cursor.line).substring(0, cursor.ch);

		for (const provider of this.providers) {
			const match = line.match(provider.trigger);
			if (match) {
				const activeFile = this.app.workspace.getActiveFile();

				if (!(activeFile instanceof TFile)) {
					return null;
				}

				const ctx: EditorSuggestContext = {
					start: { line: cursor.line, ch: match.index ?? 0 },
					end: cursor,
					query: match[0].replace(/^(@|\{\{)/, ""),
					editor,
					file: activeFile,
				};

				this.activeProvider = provider;
				this.lastContext = ctx;

				return ctx;
			}
		}

		this.activeProvider = null;
		return null;
	}

	getSuggestions(ctx: EditorSuggestContext): string[] {
		if (!this.activeProvider) return [];
		return this.activeProvider.getSuggestions(ctx.query);
	}

	selectSuggestion(value: string): void {
		if (!this.activeProvider || !this.lastContext) return;

		const ctx = this.lastContext;
		const editor = ctx.editor;

		const end = { ...ctx.end };

		const after = editor.getRange(end, { line: end.line, ch: end.ch + 2 });

		if (after === "}}") {
			end.ch += 2;
		}

		const result = this.activeProvider.onSelect(value, ctx);
		editor.replaceRange(result, ctx.start, end);
	}
}
