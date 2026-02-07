import { RELEASE_NOTES } from "src/constants/releaseNotes";
import type { TReleaseNote } from "src/types";

export function getReleaseNotesBetweenVersions(
	fromVersion: string,
	toVersion: string,
): TReleaseNote[] {
	const fromIndex = RELEASE_NOTES.findIndex((note) => note.version === fromVersion);
	const toIndex = RELEASE_NOTES.findIndex((note) => note.version === toVersion);

	if (fromIndex === -1 || toIndex === -1) {
		return getLatestReleaseNotes();
	}

	const startIndex = Math.min(fromIndex, toIndex);
	const endIndex = Math.max(fromIndex, toIndex);

	return RELEASE_NOTES.slice(startIndex, endIndex + 1);
}

export function getLatestReleaseNotes(count: number = 5): TReleaseNote[] {
	return RELEASE_NOTES.slice(0, count);
}

export function getReleaseNotesForVersion(version: string): TReleaseNote[] {
	const note = RELEASE_NOTES.find((n) => n.version === version);
	return note ? [note] : getLatestReleaseNotes(1);
}

export function compareVersions(v1: string, v2: string): number {
	const parts1 = v1.split(".").map(Number);
	const parts2 = v2.split(".").map(Number);

	for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
		const part1 = parts1[i] || 0;
		const part2 = parts2[i] || 0;

		if (part1 > part2) return 1;
		if (part1 < part2) return -1;
	}

	return 0;
}

export function isReleaseNote(version: string): boolean {
	const note = RELEASE_NOTES.find((entry) => entry.version === version);
	return !!note;
}
