import { Notice } from "src/components";
import { t } from "src/languages";
import { DatePatternFormatError } from "src/utils/dateEngine";
import { addClasses } from "src/utils/dom";

export function safeRender(containerEl: HTMLElement, label: string, fn: () => void): boolean {
	try {
		fn();
		return true;
	} catch (error) {
		// Full technical detail (including the real Error object/stack) for
		// developers, plus a toast so the user notices even if the calendar
		// view isn't the one currently focused.
		console.error(`[Persian Calendar] Failed to render ${label}:`, error);
		Notice(`[Persian Calendar] Failed to render ${label}: ${error}`);
		renderCalendarError(containerEl, error);
		return false;
	}
}

function renderCalendarError(containerEl: HTMLElement, error: unknown) {
	const box = document.createElement("div");
	addClasses(box, "persian-calendar__render-error");
	containerEl.appendChild(box);

	const title = document.createElement("div");
	addClasses(title, "persian-calendar__render-error-title");
	title.textContent = t("calendarView.renderError.title");
	box.appendChild(title);

	if (error instanceof DatePatternFormatError) {
		const body = document.createElement("div");
		addClasses(body, "persian-calendar__render-error-body");
		body.textContent = t("calendarView.renderError.patternBody");
		box.appendChild(body);

		const patternLine = document.createElement("div");
		addClasses(patternLine, "persian-calendar__render-error-line");
		patternLine.textContent = `${t("calendarView.renderError.patternLabel")} ${error.pattern}`;
		box.appendChild(patternLine);

		const tokenLine = document.createElement("div");
		addClasses(tokenLine, "persian-calendar__render-error-line");
		tokenLine.textContent = `${t("calendarView.renderError.tokenLabel")} ${error.token}`;
		box.appendChild(tokenLine);
	} else {
		const body = document.createElement("div");
		addClasses(body, "persian-calendar__render-error-body");
		body.textContent = error instanceof Error ? error.message : String(error);
		box.appendChild(body);
	}

	const hint = document.createElement("div");
	addClasses(hint, "persian-calendar__render-error-hint");
	hint.textContent = t("calendarView.renderError.hint");
	box.appendChild(hint);
}
