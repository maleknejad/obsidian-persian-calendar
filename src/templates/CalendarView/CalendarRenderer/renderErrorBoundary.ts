import { t } from "src/languages";
import { DatePatternFormatError } from "src/utils/dateEngine";

/**
 * Runs `fn`, catching any error so a failure in one render stage (e.g. the
 * body grid) doesn't take down stages that already rendered successfully
 * (e.g. the header). On failure, logs the full error for developers and
 * renders a clear, localized, user-facing explanation in `containerEl`
 * instead of leaving the calendar silently blank.
 */
export function safeRender(containerEl: HTMLElement, label: string, fn: () => void): boolean {
	try {
		fn();
		return true;
	} catch (error) {
		console.error(`[Persian Calendar] Failed to render ${label}:`, error);
		renderCalendarError(containerEl, error);
		return false;
	}
}

function renderCalendarError(containerEl: HTMLElement, error: unknown) {
	const box = containerEl.createEl("div", { cls: "persian-calendar__render-error" });

	box.createEl("div", {
		cls: "persian-calendar__render-error-title",
		text: t("calendarView.renderError.title"),
	});

	if (error instanceof DatePatternFormatError) {
		box.createEl("div", {
			cls: "persian-calendar__render-error-body",
			text: t("calendarView.renderError.patternBody"),
		});
		box.createEl("div", {
			cls: "persian-calendar__render-error-line",
			text: `${t("calendarView.renderError.patternLabel")} ${error.pattern}`,
		});
		box.createEl("div", {
			cls: "persian-calendar__render-error-line",
			text: `${t("calendarView.renderError.tokenLabel")} ${error.token}`,
		});
	} else {
		box.createEl("div", {
			cls: "persian-calendar__render-error-body",
			text: error instanceof Error ? error.message : String(error),
		});
	}

	box.createEl("div", {
		cls: "persian-calendar__render-error-hint",
		text: t("calendarView.renderError.hint"),
	});
}
