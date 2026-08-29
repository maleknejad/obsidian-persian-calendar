export function addClasses(el: HTMLElement, cls: string | string[]): void {
	const classes = Array.isArray(cls) ? cls : cls.split(/\s+/).filter(Boolean);
	if (classes.length > 0) {
		el.classList.add(...classes);
	}
}

export function setAttributes(
	el: HTMLElement,
	attrs: Record<string, string | number | boolean | null>,
): void {
	for (const [key, value] of Object.entries(attrs)) {
		if (value === null) {
			continue;
		}
		el.setAttribute(key, String(value));
	}
}
