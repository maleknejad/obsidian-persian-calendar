import { Platform } from "obsidian";
import type { EventType } from "persian-holidays";
import type { TLocale } from "src/types";
import { addClasses } from "src/utils/dom";

export default class Tooltip {
	private tooltipWrapperSelector = ".persian-calendar--tooltip-wrapper";
	private tooltipSelector = ".persian-calendar__tooltip";
	private offsetX = 10;
	private offsetY = 10;

	private getOrCreateTooltip(local: TLocale): { wrapper: HTMLElement; tooltip: HTMLElement } {
		let wrapper = activeDocument.querySelector<HTMLElement>(this.tooltipWrapperSelector);

		if (!wrapper) {
			wrapper = activeDocument.createElement("div");
			addClasses(wrapper, "persian-calendar persian-calendar--tooltip-wrapper");
			activeDocument.body.appendChild(wrapper);
		}

		const dir = local === "fa" ? "rtl" : "ltr";
		wrapper.setAttribute("dir", dir);

		let tooltip = wrapper.querySelector<HTMLElement>(this.tooltipSelector);
		if (!tooltip) {
			tooltip = activeDocument.createElement("div");
			addClasses(tooltip, "persian-calendar__tooltip");
			wrapper.appendChild(tooltip);
		}

		return { wrapper, tooltip };
	}

	public showTooltip(e: MouseEvent | TouchEvent, events: EventType[], local: TLocale) {
		const { tooltip } = this.getOrCreateTooltip(local);

		tooltip.replaceChildren();

		for (const event of events) {
			const cls = ["persian-calendar__tooltip-event"];
			if (event.isHolidayInIran) {
				cls.push("persian-calendar__day--holiday");
			}
			const eventEl = activeDocument.createElement("div");
			addClasses(eventEl, cls);
			eventEl.textContent = event.title[local];
			tooltip.appendChild(eventEl);
		}

		let x: number | undefined;
		let y: number | undefined;

		if (e instanceof MouseEvent) {
			x = e.pageX;
			y = e.pageY;
		} else if (Platform.isMobile && e.type === "touchstart") {
			x = e.touches[0].pageX;
			y = e.touches[0].pageY;

			const hideOnTouch = () => {
				this.hideTooltip();
			};

			window.setTimeout(() => {
				activeDocument.addEventListener("touchstart", hideOnTouch, { once: true });
				activeDocument.addEventListener("touchend", hideOnTouch, { once: true });
				activeDocument.addEventListener("touchcancel", hideOnTouch, { once: true });
			}, 0);
		}

		if (x === undefined || y === undefined) return;

		tooltip.style.display = "block";
		tooltip.style.left = "0px";
		tooltip.style.top = "0px";

		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = tooltip.offsetHeight;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let left = x - tooltipWidth - this.offsetX;
		if (left < 0) {
			left = x + this.offsetX;
			if (left + tooltipWidth > viewportWidth) {
				left = Math.max(0, viewportWidth - tooltipWidth - this.offsetX);
			}
		}

		let top = y + this.offsetY;
		if (top + tooltipHeight > viewportHeight + window.scrollY) {
			top = y - tooltipHeight - this.offsetY;
		}

		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
	}

	public hideTooltip() {
		const wrapper = activeDocument.querySelector(this.tooltipWrapperSelector);
		if (!wrapper) return;

		const tooltip = wrapper.querySelector(this.tooltipSelector) as HTMLElement;
		tooltip.style.display = "none";
	}
}
