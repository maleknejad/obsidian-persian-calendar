import { setIcon } from "obsidian";
import { DEFAULT_SOCIAL_LINKS } from "src/constants";
import { onLocalChange, t } from "src/languages";
import { addClasses } from "src/utils/dom";

export default function SocialLinks(
	container: HTMLElement,
	options: {
		className?: string;
	} = {},
): HTMLElement {
	const { className = "persian-calendar__social-links" } = options;

	const containerEl = document.createElement("div");
	addClasses(containerEl, className);
	container.appendChild(containerEl);

	DEFAULT_SOCIAL_LINKS.forEach((link) => {
		const a = document.createElement("a");
		a.href = link.href;
		containerEl.appendChild(a);

		setIcon(a, link.icon);

		onLocalChange(() => {
			a.title = t(link.title);
		}, true);
	});

	return containerEl;
}
