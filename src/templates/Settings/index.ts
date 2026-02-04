import type { App } from "obsidian";
import type PersianCalendarPlugin from "src/main";
import { SocialLinks } from "src/components/SocialLinks";
import { SettingsBase } from "./SettingBase";

export default class CalendarSettings extends SettingsBase {
	icon = "calendar-heart";

	constructor(app: App, plugin: PersianCalendarPlugin) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("persian-calendar");

		const contactUs = containerEl.createDiv({
			cls: "persian-calendar__setting-banner",
		});
		contactUs.createEl("h2", {
			text: "برای مطالعه‌ی راهنما، گزارش باگ یا ارائه‌ی بازخورد، از لینک‌های زیر استفاده کنید",
		});
		SocialLinks(contactUs);

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
			name: "تایید پیش از ایجاد یادداشت",
			desc: "با فعال‌سازی این گزینه، پیش از ایجاد هر یادداشت، پنجره‌ی تایید نمایش داده می‌شود.",
			key: "askForCreateNote",
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
