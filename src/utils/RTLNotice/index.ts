import { Notice } from "obsidian";

export function RTLNotice(message: string, timeout?: number): Notice {
	const notice = new Notice(message, timeout);

	const noticeEl = (notice as any).noticeEl as HTMLElement | undefined;

	if (noticeEl) {
		noticeEl.classList.add("persian-calendar-rtl-notice");
	}

	return notice;
}
