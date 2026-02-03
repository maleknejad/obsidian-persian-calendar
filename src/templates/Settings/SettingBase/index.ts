import { App, PluginSettingTab, Setting } from "obsidian";
import PersianCalendarPlugin from "src/main";
import FolderSuggest from "./FolderSuggest";
import type { TDateFormat, TSetting, TBoolSettingKeys } from "src/types";

export abstract class SettingBase extends PluginSettingTab {
	plugin: PersianCalendarPlugin;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	protected addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof TSetting) {
		new Setting(containerEl).setName(name).addText((text) => {
			text
				.setPlaceholder("")
				.setValue(this.plugin.settings[settingKey] as string)
				.onChange(async (value) => {
					(this.plugin.settings[settingKey] as string) = value;
					await this.plugin.saveSettings();
				});

			new FolderSuggest(this.app, text.inputEl);
		});
	}

	protected addToggleSetting(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: TBoolSettingKeys;
			refresh?: boolean;
		},
	) {
		new Setting(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings[opts.key]).onChange(async (value) => {
					this.plugin.settings[opts.key] = value;
					await this.plugin.saveSettings();
					if (opts.refresh) this.plugin.refreshViews();
				}),
			);
	}

	protected addDropdownSetting<T extends string = string>(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: Extract<keyof TSetting, "dateFormat" | "weekendDays">;
			options: Record<string, string>;
			defaultValue: Omit<TDateFormat, "hijri">;
			refresh?: boolean;
		},
	): void {
		new Setting(containerEl)
			.setName(opts.name)
			.setDesc(opts.desc ?? "")
			.addDropdown((dropdown) => {
				Object.entries(opts.options).forEach(([value, label]) =>
					dropdown.addOption(value as string, label as string),
				);

				dropdown
					.setValue(this.plugin.settings[opts.key] ?? opts.defaultValue)
					.onChange(async (value) => {
						(this.plugin.settings[opts.key] as any) = value as T;
						await this.plugin.saveSettings();
						if (opts.refresh) this.plugin.refreshViews();
					});
			});
	}
}
