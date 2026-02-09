import { App, PluginSettingTab, Setting as ObsidianSettings } from "obsidian";
import PersianCalendarPlugin from "src/main";
import PathSuggest from "./PathSuggest";
import type { TDateFormat, TSetting, TBoolSettingKeys } from "src/types";

export abstract class SettingsBase extends PluginSettingTab {
	plugin: PersianCalendarPlugin;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	protected addPathSetting(
		containerEl: HTMLElement,
		name: string,
		settingKey: keyof TSetting,
		opts?: {
			desc?: string;
			mode?: "folder" | "file" | "md-file";
		},
	) {
		new ObsidianSettings(containerEl)
			.setName(name)
			.setDesc(opts?.desc ?? "")
			.addText((text) => {
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings[settingKey] as string)
					.onChange(async (value) => {
						(this.plugin.settings[settingKey] as string) = value;
						await this.plugin.saveSettings();
					});

				new PathSuggest(this.app, text.inputEl, opts?.mode ?? "folder");
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
		new ObsidianSettings(containerEl)
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
		new ObsidianSettings(containerEl)
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
