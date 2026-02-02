import { Notice } from "obsidian";

export function RTLNotice(message: string, timeout?: number): Notice {
	const notice = new Notice(message, timeout);

	const noticeEl = (notice as any).noticeEl as HTMLElement | undefined;

	if (noticeEl) {
		noticeEl.setAttribute("dir", "rtl");
	}

	return notice;
}
