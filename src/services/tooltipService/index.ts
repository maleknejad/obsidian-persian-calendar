import type { TEventObjectWithoutDate } from "src/types";

export default class TooltipService {
	private tooltipWrapperSelector = ".persian-calendar--tooltip-wrapper";
	private tooltipSelector = ".persian-calendar__tooltip";
	private offsetX = 10;
	private offsetY = 10;

	private getOrCreateTooltip(): { wrapper: HTMLElement; tooltip: HTMLElement } {
		let wrapper = document.querySelector(this.tooltipWrapperSelector) as HTMLElement | null;
		let tooltip: HTMLElement | null = null;

		if (!wrapper) {
			// wrapper برای استفاده از CSS variables
			wrapper = document.createElement("div");
			wrapper.className = "persian-calendar persian-calendar--tooltip-wrapper";

			tooltip = document.createElement("div");
			tooltip.className = "persian-calendar__tooltip";

			wrapper.appendChild(tooltip);
			document.body.appendChild(wrapper);
		} else {
			tooltip = wrapper.querySelector(this.tooltipSelector) as HTMLElement | null;
			if (!tooltip) {
				tooltip = document.createElement("div");
				tooltip.className = "persian-calendar__tooltip";
				wrapper.appendChild(tooltip);
			}
		}

		return { wrapper, tooltip: tooltip! };
	}

	public showTooltip(e: MouseEvent | TouchEvent, events: TEventObjectWithoutDate[]) {
		const { tooltip } = this.getOrCreateTooltip();

		tooltip.innerHTML = events
			.map(
				({ title, holiday }) =>
					`<div class="persian-calendar__tooltip-event${
						holiday ? " persian-calendar__day--holiday" : ""
					}">${title}</div>`,
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

		if (x === undefined || y === undefined) return;

		// ابتدا موقتاً موقعیت بده تا offsetWidth درست حساب بشه
		tooltip.style.left = "0px";
		tooltip.style.top = "0px";

		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = tooltip.offsetHeight;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// تشخیص این‌که سمت راست جا داریم یا نه
		let left = x - tooltipWidth - this.offsetX; // حالت RTL: سمت چپ اشاره‌گر
		const leftSpaceEnough = left >= 0;

		if (!leftSpaceEnough) {
			// اگر جا کم بود، تولتیپ رو سمت راست اشاره‌گر بذار
			left = x + this.offsetX;
			// اگر سمت راست هم تا لبه رفت، کل تولتیپ رو داخل ویو نگه دار
			if (left + tooltipWidth > viewportWidth) {
				left = Math.max(0, viewportWidth - tooltipWidth - this.offsetX);
			}
		}

		let top = y + this.offsetY;

		// اگر پایین جا نداشت، تولتیپ رو بالای اشاره‌گر بذار
		if (top + tooltipHeight > viewportHeight + window.scrollY) {
			top = y - tooltipHeight - this.offsetY;
		}

		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
	}

	public hideTooltip() {
		const wrapper = document.querySelector(this.tooltipWrapperSelector) as HTMLElement | null;
		if (!wrapper) return;

		const tooltip = wrapper.querySelector(this.tooltipSelector) as HTMLElement | null;
		if (tooltip) {
			tooltip.style.display = "none";
		}
	}
}
