import { App, PluginSettingTab, Setting } from "obsidian";
import PersianCalendarPlugin from "src/main";
import type { TBaseDate, TPluginSetting } from "src/types";

export default class PersianCalendarSettingTab extends PluginSettingTab {
	plugin: PersianCalendarPlugin;

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.addPathSetting = this.addPathSetting.bind(this);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.setAttribute("dir", "rtl");

		containerEl.createEl("h3", { text: "تنظیمات تقویم" });
		containerEl.createEl("p", { text: "تقویم فارسی ابسیدین را از این طریق می‌توانید تنظیم کنید." });

		this.addPathSetting(containerEl, "مسیر روزنوشت‌ها", "dailyNotesFolderPath");
		new Setting(containerEl)
			.setName("فرمت نام‌گذاری و شناسایی روزنوشت‌ها")
			.setDesc(
				"مشخص کنید روزنوشت‌ها با چه فرمتی نام‌گذاری شوند. این نام در Title روزنوشت‌ها قرار می‌گیرد.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("jalali", "خورشیدی")
					.addOption("gregorian", "میلادی")
					.setValue(this.plugin.settings.dateFormat || "georgian")
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value as TBaseDate;
						await this.plugin.saveSettings();
						this.plugin.refreshViews(); // Optionally refresh views if necessary
					}),
			);
		this.addPathSetting(containerEl, "مسیر هفته‌نوشت‌ها", "weeklyNotesFolderPath");
		this.addPathSetting(containerEl, "مسیر ماه‌نوشت‌ها", "monthlyNotesFolderPath");
		this.addPathSetting(containerEl, "مسیر فصل‌نوشت‌ها", "quarterlyNotesFolderPath");
		this.addPathSetting(containerEl, "مسیر سال‌نوشت‌ها", "yearlyNotesFolderPath");
		new Setting(containerEl)
			.setName("فعال‌سازی نمایش فصل‌نوشت‌ها در تقویم")
			.setDesc("نمایش یا پنهان کردن ردیف فصل‌نوشت‌ها در نمای تقویم")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableQuarterlyNotes).onChange(async (value) => {
					this.plugin.settings.enableQuarterlyNotes = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}),
			);
		new Setting(containerEl)
			.setName("فعال‌سازی نمایش تقویم میلادی")
			.setDesc("می‌توانید مشخص کنید تقویم میلادی زیر تقویم شمسی نمایش داده شود.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showGeorgianDates).onChange(async (value) => {
					this.plugin.settings.showGeorgianDates = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}),
			);

		new Setting(containerEl)
			.setName("نمایش تقویم هجری قمری")
			.setDesc("می‌توانید مشخص کنید تقویم هجری قمری کنار تقویم هجری شمسی نمایش داده شود.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showHijriDates).onChange(async (value) => {
					this.plugin.settings.showHijriDates = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}),
			);

		new Setting(containerEl)
			.setName("نمایش روزهای تعطیل رسمی در تقویم")
			.setDesc(
				"مشخص کنید آیا مایلید روزهای تعطیل رسمی در تقویم با رنگ قرمز نمایش داده شوند یا خیر.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showHolidays).onChange(async (value) => {
					this.plugin.settings.showHolidays = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}),
			);

		new Setting(containerEl)
			.setName("روزهای تعطیل هفته")
			.setDesc("مشخص کنید چه روزهایی در هفته با رنگ قرمز  به عنوان تعطیلی نمایش داده شوند")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("friday", "جمعه")
					.addOption("thursday-friday", "پنجشنبه و جمعه")
					.addOption("friday-saturday", "جمعه و شنبه")
					.setValue(this.plugin.settings.weekendDays)
					.onChange(async (value) => {
						this.plugin.settings.weekendDays = value;
						await this.plugin.saveSettings();
						this.plugin.refreshViews();
					}),
			);
		new Setting(containerEl)
			.setName("نمایش تعطیلات رسمی تقویم ایران")
			.setDesc(
				"مشخص کنید آیا مایلید رویدادهای تقویم رسمی ایران در تولتیپ و {{مناسبت}} نمایش داده شود یا خیر",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showOfficialIranianCalendar)
					.onChange(async (value) => {
						this.plugin.settings.showOfficialIranianCalendar = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("نمایش رویدادهای تقویم ایران باستان")
			.setDesc(
				"مشخص کنید آیا مایلید رویدادهای تقویم ایران باستان در تولتیپ و {{مناسبت}} نمایش داده شود یا خیر.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showAncientIranianCalendar).onChange(async (value) => {
					this.plugin.settings.showAncientIranianCalendar = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("نمایش رویدادهای تقویم شیعی")
			.setDesc(
				"مشخص کنید آیا مایلید رویدادهای تقویم شیعی در تولتیپ و {{مناسبت}} نمایش داده شود یا خیر.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showShiaCalendar).onChange(async (value) => {
					this.plugin.settings.showShiaCalendar = value;
					await this.plugin.saveSettings();
				}),
			);

		const githubadvice = containerEl.createEl("p");
		githubadvice.appendText("پیش از هر اقدامی توصیه می‌کنم راهنمای افزونه در ");
		githubadvice.createEl("a", {
			text: "گیت‌هاب",
			href: "https://github.com/maleknejad/obsidian-persian-calendar",
		});
		githubadvice.appendText(
			" را مطالعه کنید و با ویژگی‌هایی که این افزونه در اختیارتان قرار می‌دهد آشنا شوید.",
		);
		containerEl.createEl("p", {
			text: 'مسیرها را قبل از تنظیم کردن در ابسیدین ایجاد کنید. مسیرها باید بدون "/" در ابتدای آن باشد.',
		});
		containerEl.createEl("p", {
			text: "برای اعمال تغییرات، لازم است تقویم را از تنظیمات ابسیدین مجددا فعال کنید.",
		});
		const templaterparagraph = containerEl.createEl("p");
		templaterparagraph.appendText("برای تنظیم کردن قالب برای نوشته‌ها می‌توانید از افزونه ");
		templaterparagraph.createEl("a", {
			text: "Templater",
			href: "https://github.com/SilentVoid13/Templater",
		}),
			templaterparagraph.appendText(" استفاده کنید. راهنمای استفاده از آن در "),
			templaterparagraph.createEl("a", {
				text: "گیت‌هاب",
				href: "https://github.com/maleknejad/obsidian-persian-calendar/",
			}),
			templaterparagraph.appendText(" نوشته شده است. حتما راهنمای افزونه را مطالعه کنید.");
		const paragraph = containerEl.createEl("p");
		paragraph.appendText("در صورت مشاهده باگ و یا ارائه پیشنهاد و یا درخواست راهنمایی لطفا در ");
		paragraph.createEl("a", {
			text: "گیت‌هاب",
			href: "https://github.com/maleknejad/obsidian-persian-calendar/",
		}),
			paragraph.appendText(" به اشتراک بگذارید."),
			paragraph.createEl("br"),
			paragraph.createEl("br"),
			paragraph.createEl("br"),
			paragraph.appendText(
				" ‌توسعه‌یافته توسط حسین ملک نژاد، برای حمایت و پیگیری توسعه پلاگین‌های ابسیدین ",
			),
			paragraph.createEl("a", { text: "کارفکر", href: "https://t.me/karfekr" }),
			paragraph.appendText(" را دنبال کنید."),
			paragraph.createEl("br"),
			paragraph.appendText(" نسخه 4.0.0");
	}

	addPathSetting(containerEl: HTMLElement, name: string, settingKey: keyof TPluginSetting) {
		new Setting(containerEl).setName(name).addText((text) =>
			text
				.setPlaceholder("Path/for/notes")
				.setValue(this.plugin.settings[settingKey] as string)
				.onChange(async (value) => {
					(this.plugin.settings[settingKey] as string) = value;
					await this.plugin.saveSettings();
				}),
		);
	}
}
