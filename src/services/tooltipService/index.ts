import type { TEventObjectWithoutDate } from "src/types";

export default class TooltipService {
	private tooltipSelector = ".calendar-tooltip";

	private getOrCreateTooltip(): HTMLElement {
		let tooltip = document.querySelector(this.tooltipSelector) as HTMLElement | null;

		if (!tooltip) {
			tooltip = document.createElement("div");
			tooltip.className = "calendar-tooltip";
			document.body.appendChild(tooltip);
		}

		return tooltip;
	}

	public showTooltip(e: MouseEvent | TouchEvent, events: TEventObjectWithoutDate[]) {
		const tooltip = this.getOrCreateTooltip();

		tooltip.innerHTML = events
			.map(
				({ title, holiday }) =>
					`<div style="color: ${holiday ? "var(--text-error)" : "var(--text-normal)"}">${
						title
					}</div>`,
			)
			.join("");

		tooltip.style.display = "block";

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (e instanceof TouchEvent && e.touches.length > 0) {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;
		}

		if (x !== undefined && y !== undefined) {
			tooltip.style.left = `${x - tooltip.offsetWidth - 10}px`;
			tooltip.style.top = `${y + 10}px`;
		}
	}

	public hideTooltip() {
		const tooltip = document.querySelector(this.tooltipSelector) as HTMLElement | null;
		if (tooltip) {
			tooltip.style.display = "none";
		}
	}
}
