import { App, PluginSettingTab, setIcon, Setting } from "obsidian";
import PersianCalendarPlugin from "src/main";
import { FolderSuggest } from "src/services";
import type { TDateFormat, TSetting, TBoolSettingKeys } from "src/types";

type DropdownKeys = Extract<keyof TSetting, "dateFormat" | "weekendDays">;

export default class PersianCalendarSetting extends PluginSettingTab {
	plugin: PersianCalendarPlugin;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof TSetting) {
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

	private addToggleSetting(
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

	private addDropdownSetting<T extends string = string>(
		containerEl: HTMLElement,
		opts: {
			name: string;
			desc?: string;
			key: DropdownKeys;
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

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.setAttribute("dir", "rtl");
		containerEl.addClass("persian-calendar");

		const intro = containerEl.createDiv({
			cls: "persian-calendar__settings-header",
		});
		intro.createEl("h2", {
			text: "برای مطالعه‌ی راهنما، گزارش باگ یا ارائه‌ی بازخورد، از لینک‌های زیر استفاده کنید",
		});
		const links = intro.createDiv({ cls: "persian-calendar__settings-links" });
		const github = links.createEl("a", {
			href: "https://github.com/maleknejad/obsidian-persian-calendar",
			title: "مستندات پلاگین در Github",
		});
		setIcon(github, "github");
		const website = links.createEl("a", {
			href: "https://karfekr.ir",
			title: "وبسایت کارفکر",
		});
		setIcon(website, "brain");
		const telegramChannel = links.createEl("a", {
			href: "https://t.me/karfekr",
			title: "کانال تلگرام کارفکر",
		});
		setIcon(telegramChannel, "send");
		const telegramGroup = links.createEl("a", {
			href: "https://t.me/ObsidianFarsi",
			title: "جامعه‌ی فارسی ابسیدین",
		});
		setIcon(telegramGroup, "message-circle");

		containerEl.createEl("h2", { text: "تنظیمات عمومی" });
		this.addDropdownSetting(containerEl, {
			name: "فرمت نام‌گذاری و شناسایی روزنوشت‌ها",
			desc: "روزنوشت‌ها با چه فرمتی نام‌گذاری و شناسایی شود؟",
			key: "dateFormat",
			options: {
				jalali: "هجری شمسی",
				gregorian: "میلادی",
			},
			defaultValue: "gregorian",
			refresh: true,
		});
		this.addToggleSetting(containerEl, {
			name: "نمایش فصل‌ها در تقویم",
			desc: "آیا مایلید فصل‌ها نمایش داده شود؟",
			key: "showSeasonalNotes",
			refresh: true,
		});

		containerEl.createEl("h2", { text: "مسیر یادداشت‌های تقویم" });
		this.addPathSetting(containerEl, "مسیر روزنوشت‌ها", "dailyNotesPath");
		this.addPathSetting(containerEl, "مسیر هفته‌نوشت‌ها", "weeklyNotesPath");
		this.addPathSetting(containerEl, "مسیر ماه‌نوشت‌ها", "monthlyNotesPath");
		this.addPathSetting(containerEl, "مسیر فصل‌نوشت‌ها", "seasonalNotesPath");
		this.addPathSetting(containerEl, "مسیر سال‌نوشت‌ها", "yearlyNotesPath");

		containerEl.createEl("h2", { text: "تقویم‌های مکمل" });
		this.addToggleSetting(containerEl, {
			name: "نمایش تقویم میلادی",
			desc: "آیا مایلید تقویم میلادی نمایش داده شود؟",
			key: "showGeorgianDates",
			refresh: true,
		});
		this.addToggleSetting(containerEl, {
			name: "نمایش تقویم هجری قمری",
			desc: "آیا مایلید تقویم هجری قمری نمایش داده شود؟",
			key: "showHijriDates",
			refresh: true,
		});

		containerEl.createEl("h2", { text: "نمایش تعطیلات" });
		this.addToggleSetting(containerEl, {
			name: "نمایش تعطیلات رسمی ایران",
			desc: "آیا مایلید تعطیلات رسمی ایران با رنگ قرمز روی تقویم نمایش داده شود؟",
			key: "showHolidays",
			refresh: true,
		});
		this.addDropdownSetting<"friday" | "thursday-friday" | "friday-saturday">(containerEl, {
			name: "نمایش تعطیلات هفتگی",
			desc: "چه روزهایی با رنگ قرمز  به عنوان تعطیلات هفتگی نمایش داده شود؟",
			key: "weekendDays",
			options: {
				friday: "جمعه",
				"thursday-friday": "پنجشنبه و جمعه",
				"friday-saturday": "جمعه و شنبه",
			},
			defaultValue: "friday",
			refresh: true,
		});

		containerEl.createEl("h2", { text: "نمایش مناسبت‌ها" });
		this.addToggleSetting(containerEl, {
			name: "نمایش مناسبت‌های رسمی ایران(هجری شمسی)",
			desc: "آیا مایلید مناسبت‌های رسمی ایران نمایش داده شود؟",
			key: "showIRGovernmentEvents",
		});
		this.addToggleSetting(containerEl, {
			name: "نمایش مناسبت‌های باستانی(هجری شمسی)",
			desc: "آیا مایلید مناسبت‌های ایران باستان نمایش داده شود؟",
			key: "showIRAncientEvents",
		});
		this.addToggleSetting(containerEl, {
			name: "نمایش مناسبت‌های شیعی(هجری قمری)",
			desc: "آیا مایلید مناسبت‌های شیعی نمایش داده شود؟",
			key: "showIRIslamEvents",
		});
		this.addToggleSetting(containerEl, {
			name: "نمایش مناسبت‌های جهانی(میلادی)",
			desc: "آیا مایلید مناسبت‌های جهانی نمایش داده شود؟",
			key: "showGlobalEvents",
		});
	}
}
