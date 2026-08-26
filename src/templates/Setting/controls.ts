import type { App } from "obsidian";
import { Setting } from "obsidian";
import { t } from "src/languages";
import type { BoolKey, StringKey, TPathSuggestMode, TSetting } from "src/types";
import type { SettingsController } from "./SettingsController";
import { PathSuggest } from "./suggest/PathSuggest";
import type { Validator } from "./validation";

function trackLabel(
	controller: SettingsController,
	setting: Setting,
	nameKey: string,
	descKey: string | null,
): void {
	controller.trackLocale(() => {
		setting.setName(t(nameKey));
		setting.setDesc(descKey ? t(descKey) : "");
	});
}

export function addHeading(
	controller: SettingsController,
	containerEl: HTMLElement,
	key: string,
): Setting {
	const setting = new Setting(containerEl).setHeading();

	controller.trackLocale(() => setting.setName(t(key)));

	return setting;
}

export function addToggle<K extends BoolKey>(
	controller: SettingsController,
	containerEl: HTMLElement,
	nameKey: string,
	descKey: string | null,
	key: K,
	opts: { refresh?: boolean } = {},
): Setting {
	const setting = new Setting(containerEl).addToggle((toggle) => {
		toggle.setValue(controller.get(key)).onChange(async (value) => {
			await controller.set(key, value, { refresh: opts.refresh });
		});
	});

	trackLabel(controller, setting, nameKey, descKey);
	return setting;
}

export function addDropdown<K extends StringKey>(
	controller: SettingsController,
	containerEl: HTMLElement,
	nameKey: string,
	descKey: string | null,
	key: K,
	optionKeys: Record<string, string>,
	opts: { refresh?: boolean; onSelect?: (value: string) => void } = {},
): Setting {
	const setting = new Setting(containerEl).addDropdown((dropdown) => {
		const optionMap = new Map<HTMLOptionElement, string>();

		for (const [value, labelKey] of Object.entries(optionKeys)) {
			dropdown.addOption(value, "");
			optionMap.set(dropdown.selectEl.options[dropdown.selectEl.options.length - 1], labelKey);
		}

		controller.trackLocale(() => {
			for (const [option, labelKey] of optionMap) {
				option.textContent = t(labelKey);
			}
		});

		dropdown.setValue(controller.get(key)).onChange(async (value) => {
			opts.onSelect?.(value);
			await controller.set(key, value as TSetting[K], { refresh: opts.refresh });
		});
	});

	trackLabel(controller, setting, nameKey, descKey);
	return setting;
}

export function addPath<K extends StringKey>(
	app: App,
	controller: SettingsController,
	containerEl: HTMLElement,
	nameKey: string,
	descKey: string | null,
	key: K,
	mode: TPathSuggestMode,
): Setting {
	const setting = new Setting(containerEl).addText((text) => {
		text.setValue(controller.get(key)).onChange(async (value) => {
			await controller.set(key, value as TSetting[K], { debounce: true });
		});

		new PathSuggest(app, text.inputEl, mode);
	});

	trackLabel(controller, setting, nameKey, descKey);
	return setting;
}

export function addValidatedText<K extends StringKey>(
	controller: SettingsController,
	containerEl: HTMLElement,
	nameKey: string,
	descKey: string | null,
	key: K,
	validator: Validator,
): Setting {
	const applyFeedback = (inputEl: HTMLInputElement, value: string) => {
		const result = validator(value);
		inputEl.toggleClass("persian-calendar__setting-input--invalid", !result.valid);
		inputEl.title = result.message;
	};

	const setting = new Setting(containerEl).addText((text) => {
		text.setValue(controller.get(key)).onChange(async (value) => {
			applyFeedback(text.inputEl, value);
			await controller.set(key, value as TSetting[K], { debounce: true });
		});

		applyFeedback(text.inputEl, text.inputEl.value);
	});

	trackLabel(controller, setting, nameKey, descKey);
	return setting;
}
