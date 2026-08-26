import { Platform } from "obsidian";
import type { EventType } from "persian-holidays";
import type { TLocale } from "src/types";

export default class Tooltip {
	private tooltipWrapperSelector = ".persian-calendar--tooltip-wrapper";
	private tooltipSelector = ".persian-calendar__tooltip";
	private offsetX = 10;
	private offsetY = 10;

	private getOrCreateTooltip(local: TLocale): { wrapper: HTMLElement; tooltip: HTMLElement } {
		let wrapper = activeDocument.querySelector<HTMLElement>(this.tooltipWrapperSelector);

		if (!wrapper) {
			wrapper = activeDocument.body.createDiv({
				cls: "persian-calendar persian-calendar--tooltip-wrapper",
			});
		}

		const dir = local === "fa" ? "rtl" : "ltr";
		wrapper.setAttr("dir", dir);

		let tooltip = wrapper.querySelector<HTMLElement>(this.tooltipSelector);
		if (!tooltip) {
			tooltip = wrapper.createDiv({ cls: "persian-calendar__tooltip" });
		}

		return { wrapper, tooltip };
	}

	public showTooltip(e: MouseEvent | TouchEvent, events: EventType[], local: TLocale) {
		const { tooltip } = this.getOrCreateTooltip(local);

		tooltip.empty();

		for (const event of events) {
			const cls = ["persian-calendar__tooltip-event"];
			if (event.isHolidayInIran) {
				cls.push("persian-calendar__day--holiday");
			}
			tooltip.createDiv({ cls, text: event.title[local] });
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

		tooltip.setCssProps({ display: "block", left: "0px", top: "0px" });

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

		tooltip.setCssProps({ left: `${left}px`, top: `${top}px` });
	}

	public hideTooltip() {
		const wrapper = activeDocument.querySelector(this.tooltipWrapperSelector);
		if (!wrapper) return;

		const tooltip = wrapper.querySelector(this.tooltipSelector) as HTMLElement;
		tooltip.setCssProps({
			display: "none",
		});
	}
}
