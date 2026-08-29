import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import SocialLinks from "src/components/SocialLinks";
import { getDirection, onLocalChange, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { SectionContext } from "src/types";
import { addClasses } from "src/utils/dom";
import { SettingsController } from "./SettingsController";
import { SECTION_REGISTRY } from "./sections/registry";

export default class CalendarSettingTab extends PluginSettingTab {
	readonly plugin: PersianCalendarPlugin;

	private controller?: SettingsController;
	private unsubscribeLocale?: () => void;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	hide(): void {
		this.unsubscribeLocale?.();
		this.unsubscribeLocale = undefined;

		this.controller?.dispose();
		this.controller = undefined;
	}

	display(): void {
		this.hide();

		this.controller = new SettingsController(this.plugin);

		this.unsubscribeLocale = onLocalChange(() => {
			this.containerEl.style.direction = getDirection();
		});

		const { containerEl } = this;

		containerEl.replaceChildren();
		containerEl.classList.add("persian-calendar");
		containerEl.style.direction = getDirection();

		const contactUs = document.createElement("div");
		addClasses(contactUs, "persian-calendar__setting-banner");
		containerEl.appendChild(contactUs);

		const heading = new Setting(contactUs).setHeading();
		this.controller.trackLocale(() => heading.setName(t("setting.banner.title")));

		SocialLinks(contactUs);

		const ctx: SectionContext = { app: this.app, controller: this.controller };

		for (const renderSection of SECTION_REGISTRY) {
			renderSection(ctx, containerEl);
		}
	}
}
