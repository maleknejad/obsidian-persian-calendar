import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import SocialLinks from "src/components/SocialLinks";
import { getDirection, onLocalChange, t } from "src/languages";
import type PersianCalendarPlugin from "src/main";
import type { SectionContext } from "src/types";
import { SettingsController } from "./SettingsController";
import { SECTION_REGISTRY } from "./sections/registry";

/**
 * NOTE on Obsidian's declarative settings-search API (`getSettingDefinitions()`,
 * Obsidian 1.13.0+):
 *
 * An earlier revision of this file tried to satisfy the "settings should be
 * searchable" request by overriding `getSettingDefinitions()` and delegating
 * each section's existing imperative rendering into a `SettingDefinitionRender`
 * mounted via `group.listEl`. That broke rendering on 1.13.0+: once
 * `getSettingDefinitions()` returns a non-empty array, Obsidian stops calling
 * `display()` entirely and renders declaratively from those definitions
 * instead — only the definitions' own heading rows survived, and the
 * sections' actual controls (toggles, dropdowns, text inputs) never
 * appeared, because `render()` is documented for a single custom-styled row,
 * not for hosting an arbitrarily large imperative subtree of further
 * `Setting` rows.
 *
 * Getting genuine per-field search support the way the API is designed for
 * would mean re-expressing every individual setting across all seven
 * section files as declarative `SettingDefinitionControl` entries (with a
 * `getControlValue`/`setControlValue` override bridging to this plugin's
 * `setting` object, since the default implementation reads/writes
 * `plugin.settings`, not `plugin.setting`) — a large rewrite of this
 * plugin's settings UI that can't be safely verified without a live
 * Obsidian 1.13+ instance. Given that attempting a smaller, cleverer
 * middle ground already broke settings entirely once, this class
 * deliberately does NOT override `getSettingDefinitions()`. `PluginSettingTab`'s
 * own default implementation returns an empty array, which keeps Obsidian
 * calling `display()` exactly as before on every supported version —
 * correctness over search-discoverability.
 */
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
			this.containerEl.setCssProps({ direction: getDirection() });
		});

		const { containerEl } = this;

		containerEl.empty();
		containerEl.addClass("persian-calendar");
		containerEl.setCssProps({ direction: getDirection() });

		const contactUs = containerEl.createEl("div", {
			cls: "persian-calendar__setting-banner",
		});

		const heading = new Setting(contactUs).setHeading();
		this.controller.trackLocale(() => heading.setName(t("setting.banner.title")));

		SocialLinks(contactUs);

		const ctx: SectionContext = { app: this.app, controller: this.controller };

		for (const renderSection of SECTION_REGISTRY) {
			renderSection(ctx, containerEl);
		}
	}
}
