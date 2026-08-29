import type { TReleaseNote } from "src/types";

//! ترتیب مهمه - جدیدترین ورژن ابتدا قرار میگیره
export const RELEASE_NOTES: TReleaseNote[] = [
	{
		version: "4.8.7",
		changes: {
			fa: ["بهبود پلاگین طبق پیشنهادات جدید Obsidian Scorecard"],
			en: ["Improve the plugin based on the latest Obsidian Scorecard recommendations"],
		},
	},
	{
		version: "4.8.6",
		changes: {
			fa: [
				"برطرف کردن باگ تغییر زبان",
				"تغییر عنوان دکمه‌ای «امروز» به «اکنون» برای توصیف بهتر عملکرد آن",
				"نمایش بهتر خطاهای مربوط به مسیردهی پویا",
				"برطرف کردن باگ مربوط به مسیردهی داینامیک YYYY/jQQ",
				"بهبود پلاگین طبق پیشنهادات جدید Obsidian Scorecard",
			],
			en: [
				"Fix the language-switching bug",
				'Rename the "Today" button to "Current" to better describe its functionality',
				"Improve the display of dynamic path resolution errors",
				"Fix the dynamic YYYY/jQQ path resolution bug",
				"Improve the plugin based on the latest Obsidian Scorecard recommendations",
			],
		},
	},
	{
		version: "4.8.3",
		changes: {
			fa: ["برطرف کردن باگ فصل‌نوشت"],
			en: ["Fix seasonal note generation and lookup"],
		},
	},
	{
		version: "4.8.2",
		changes: {
			fa: ["برطرف کردن باگ هفته‌نوشت"],
			en: ["Fix weekly note generation and lookup"],
		},
	},
	{
		version: "4.8.1",
		changes: {
			fa: [
				"اکنون قادر خواهید بود که فرمت نام‌گذاری روزنوشت‌ها را طوری که دوست دارید تعیین کنید.",
				"کاربران می‌توانند ماه‌نوشت و سال‌نوشت خود را به فرمت میلادی ثبت کنند تا با دیگر پلاگین‌های تقویمی تداخلی وجود نداشته باشد.",
				"اکنون کاربران قادر به تعیین نحوه‌ی شماره‌گذاری هفته‌ها هستند.",
				"برطرف کردن باگ مربوط به نمایش روزنوشت باز شده در تقویم.",
				"بهبود کد تنظیمات پلاگین و همچنین تغییر برخی از توضیحات برای شفافیت استفاده‌ی کاربران",
				"آپدیت تمام وابستگی‌های پلاگین به آخرین نسخه",
			],
			en: [
				"You can now customize the naming format of your daily notes.",
				"Monthly and yearly notes can now use the Gregorian calendar format for better compatibility with other calendar plugins.",
				"Users can now customize the week numbering system.",
				"Fixed the bug related to displaying opened diary notes in the calendar.",
				"Improved the plugin settings code and revised some descriptions to provide clearer guidance for users.",
				"Updated all plugin dependencies to their latest versions.",
			],
		},
	},
	{
		version: "4.7.2",
		changes: {
			fa: [
				"رفع مشکل نمایش مناسبت‌ها روی روزهای تقویم، با وجود غیرفعال بودن هر شش گزینه‌ی نمایش مناسبت‌ها.",
			],
			en: [
				'Fixed tooltips appearing on calendar days when all six "Show Events" options were disabled.',
			],
		},
	},
	{
		version: "4.7.1",
		changes: {
			fa: [
				"ویژگی جدید '@/' برای اضافه شدن تاریخ بدون لینک به یادداشت",
				"رفع باگ باز کردن روزنوشت به هنگام باز کردن ابسیدین",
				"از این پس کاربران می‌توانند از روی تقویم ببیند که کدام روزنوشت را باز کرده‌اند",
				"رفع باگ نمایش مناسبت‌ها در MacOS",
				"بازگشت به رفتار پیشفرض باز شدن یادداشت با کلیک روی تقویم",
				"بهبود پلاگین طبق پیشنهادات جدید Obsidian Scorecard",
			],
			en: [
				"Add @/ for adding date without link to note",
				"Fix daily note opening bug on Obsidian startup",
				"The calendar now highlights the currently open daily note",
				"Fix Tooltip display bug on MacOS",
				"Revert to default behavior of opening note on calendar click",
				"Code improvements based on Obsidian Scorecard suggestions",
			],
		},
	},
	{
		version: "4.6.1",
		changes: {
			fa: ["بهبود ساختار کد تنظیمات و کنار گذاشتن display() منسوخ شده"],
			en: ["Refactor config structure and remove deprecated display()"],
		},
	},
	{
		version: "4.6.0",
		changes: {
			fa: [
				"جداسازی منطق مناسبت‌های تقویم از پلاگین",
				"بهبود ساختار کلی کد پلاگین و اطمینان بخشی به فانکشن‌های پایه",
				"بهبود پلاگین طبق پیشنهادات جدید Obsidian Scorecard",
			],
			en: [
				"Separate calendar event logic from the plugin",
				"Improving the overall plugin code structure and ensuring the reliability of core functions.",
				"Code improvements based on Obsidian Scorecard suggestions",
			],
		},
	},
	{
		version: "4.5.12",
		changes: {
			fa: ["بهبود پلاگین طبق پیشنهادات جدید Obsidian Scorecard"],
			en: ["Code improvements based on Obsidian Scorecard suggestions"],
		},
	},
	{
		version: "4.5.9",
		changes: {
			fa: [
				"برطرف کردن باگ عبارت معنایی {{مناسبت یادداشت}}",
				"اصلاح باگ نمایش Tooltip",
				"عملکرد رفتاری پیشنهاد مسیر قالب و ایجاد یادداشت به پیشنهادِ Obsidian Scorecard",
			],
			en: [
				"Fix semantic expression bug {{مناسبت یادداشت}}",
				"Fix Tooltip display bug",
				"Behavioral performance of template-path suggestion, according to Obsidian Scorecard",
			],
		},
	},
	{
		version: "4.5.5",
		changes: {
			fa: [
				"اضافه شدن دوباره‌ی امکان باز کردن تقویم با دستور command",
				"دو زبانه شدن نمایش تغییرات هر نسخه از برنامه",
				"بهبود کد براساس پیشنهادات Obsidian Scorecard",
				"تنظیم دقیق حداقل ورژن ابسیدین برای اجرای پلاگین",
				"تغییر آدرس پیشفرض یادداشت‌های تقویم برای کاربران جدید",
			],
			en: [
				"Re-added the ability to open the calendar via command palette",
				"Bilingual display of release notes for each version",
				"Code improvements based on Obsidian Scorecard suggestions",
				"Set minimum Obsidian version requirement for the plugin",
				"Change default path for calendar notes for new users",
			],
		},
	},
	{
		version: "4.5.1",
		changes: {
			fa: [
				"بهبود متن عنوان رویدادهای تقویم",
				"بهبود نمایش تقویم در پنجره‌ی کوچک برای زبان انگلیسی",
				"بهبود نمایش تقویم هجری شمسی در حالت غیرفعال بودن تقویم‌های مکمل",
			],
			en: [
				"Improved calendar event title text",
				"Improved calendar display in small window for English language",
				"Improved Persian calendar display when complementary calendars are disabled",
			],
		},
	},
	{
		version: "4.5.0",
		changes: {
			fa: [
				"حالا کاربران میتوانند از api اختصاصی پلاگین تقویم فارسی در اسکریپت‌نویسی‌ها استفاده کنند.",
				"می‌توانید زبان پلاگین را به فارسی یا انگلیسی تغییر دهید(پیشفرض انگلیسی)",
				"حالا میتونید از انتخابگر تاریخ(datepicker) برای انتخاب تاریخ شمسی در یادداشت‌ها استفاده کنید.",
				"حالا خزانه‌ی مناسبات تقویم فارسی غنی‌تر از همیشه است.",
				"مناسبات اهل تسنن و امکان تغییر تاریخ هجری به ام‌القری در اختیار کاربران اهل سنت قرار گرفت.",
				"کاربران می‌توانند از طریق تنظیمات تاریخ هجری قمری را بر پایه‌ی ام‌القری عربستان یا ستاد استهلال ایران قرار دهند.",
				"حالا شما می‌توانید از امکان پیشنهاد(suggestion) عبارات معنادار استفاده کنید.",
				"بهبود بیشتر در ساختار پروژه و برطرف کردن برخی باگ‌ها",
			],
			en: [
				"Users can now use the Persian Calendar plugin's private API in scripting",
				"You can change the plugin language to Persian or English (default English)",
				"Now you can use the date picker to select Persian dates in notes",
				"The Persian calendar's occasions repository is richer than ever",
				"Sunni occasions and the option to change Hijri to Umm al-Qura are now available for Sunni users",
				"Users can choose Hijri calendar based on Saudi Umm al-Qura or Iran's Istehlal committee in settings",
				"Now you can use meaningful expressions suggestion feature",
				"Further project structure improvements and bug fixes",
			],
		},
	},
	{
		version: "4.3.0",
		changes: {
			fa: [
				"برطرف کردن باگ نادیده گرفتن تنظیمات در command palette",
				"باز کردن خودکار روزنوشت امروز هنگام راه‌اندازی برنامه(امکان فعال‌سازی در تنظیمات)",
				"امکان استفاده از عبارات معنادار در بیرون از یادداشت‌های تقویمی دوباره مهیا شد.",
				"پس از جایگذاری عبارات معنادار پیغامی به کاربر نمایش داده می‌شود.",
				"افزودن چند عبارت معنادار جدید: {{روزهای گذشته ماه}} {{روزهای گذشته فصل}} {{روزهای باقیمانده ماه}} {{روزهای باقیمانده فصل}}",
				"تغییر عبارت معنادار {{روزهای گذشته}} به {{روزهای گذشته سال}}",
				"تغییر عبارت معنادار {{روزهای باقیمانده}} به {{روزهای باقیمانده سال}}",
				"عبارات معنادار خانواده‌ی «روزهای باقیمانده» و «روزهای گذشته» به صورت پیشفرض به تاریخ روزنوشت وابسته هستند اما اگر در روزنوشت نباشند نتیجه را براساس تاریخ جاری نمایش می‌دهند.",
				"بهبود استایل مودال تایید ایجاد یادداشت در موبایل",
				"دو عبارت معنادار جدید: {{روز ماه یادداشت}} {{روز ماه جاری}}",
				"بهبود نمایش مناسبت‌ها در عبارات معنادار",
			],
			en: [
				"Fixed bug that ignored settings in command palette",
				"Auto-open today's daily note on startup (enable in settings)",
				"Using meaningful expressions outside calendar notes is available again",
				"After inserting meaningful expressions, a notification is shown",
				"Added new meaningful expressions: {{روزهای گذشته ماه}} {{روزهای گذشته فصل}} {{روزهای باقیمانده ماه}} {{روزهای باقیمانده فصل}}",
				"Changed expression {{روزهای گذشته}} to {{روزهای گذشته سال}}",
				"Changed expression {{روزهای باقیمانده}} to {{روزهای باقیمانده سال}}",
				"Expressions of type 'remaining days' and 'past days' depend on the daily note by default; if not in a daily note, they use the current date",
				"Improved mobile note creation confirmation modal styling",
				"Two new meaningful expressions: {{روز ماه یادداشت}} {{روز ماه جاری}}",
				"Improved occasion display in meaningful expressions",
			],
		},
	},
	{
		version: "4.2.0",
		changes: {
			fa: [
				"تغییر و جایگزینی کامل عناوین عبارات معنادار برای درک بهتر عملکردشان (break change)",
				"عبارات معنادار جدید برای یادداشت: {{تاریخ شمسی یادداشت}} {{مناسبت یادداشت}} {{تاریخ میلادی یادداشت}} {{تاریخ قمری یادداشت}}",
				"عبارات معنادار جدید برای تاریخ جاری: {{تاریخ شمسی جاری}} {{مناسبت جاری}} {{تاریخ میلادی جاری}} {{تاریخ قمری جاری}}",
				"افزودن عبارات معنادار جدید برای فصل: {{اول فصل}} {{آخر فصل}} {{فصل یادداشت}}",
				"عبارت معنادار جدید برای نام ماه و فصل: {{نام ماه یادداشت}} {{نام ماه جاری}} {{نام فصل یادداشت}} {{نام فصل جاری}}",
				"افزودن دو عبارت معنادار برای مناسبت: {{مناسبت یادداشت}} {{مناسبت جاری}}",
				"امکان اسکرول نمایش تقویم در ارتفاع کوچک",
			],
			en: [
				"Complete overhaul of meaningful expression names for better understanding (breaking change)",
				"New meaningful expressions for note: {{تاریخ شمسی یادداشت}} {{مناسبت یادداشت}} {{تاریخ میلادی یادداشت}} {{تاریخ قمری یادداشت}}",
				"New meaningful expressions for current date: {{تاریخ شمسی جاری}} {{مناسبت جاری}} {{تاریخ میلادی جاری}} {{تاریخ قمری جاری}}",
				"Added new meaningful expressions for season: {{اول فصل}} {{آخر فصل}} {{فصل یادداشت}}",
				"New meaningful expression for month/season name: {{نام ماه یادداشت}} {{نام ماه جاری}} {{نام فصل یادداشت}} {{نام فصل جاری}}",
				"Added two meaningful expressions for occasions: {{مناسبت یادداشت}} {{مناسبت جاری}}",
				"Scrollable calendar in small heights",
			],
		},
	},
	{
		version: "4.0.0",
		changes: {
			fa: [
				"امکان مسیردهی داینامیک برای یادداشت‌های ماهانه، فصلی و سالانه.",
				"بهینه‌سازی پردازش و کاهش چشم‌گیر حجم پلاگین همراه با عملکرد بهتر.",
				"رفع باگ‌ها و ناهماهنگی‌ها در محاسبه‌ی تاریخ هجری قمری.",
				"بهبود رابط کاربری و طراحی واکنش‌گرا و متناسب با اندازه صفحات مختلف.",
				"بهبود عملکرد دکمه «امروز» برای بازگشت سریع به تاریخ فعلی بدون ساخت یادداشت اضافی.",
				"امکان بروزرسانی دستی تقویم بدون نیاز به باز و بسته کردن دوباره‌ی برنامه.",
				"بهبود نمایش و مدیریت مناسبت‌ها و تعطیلات رسمی ایران.",
				"اضافه شدن دستور جدید برای جایگزینی عبارات معنادار در یادداشت‌های دلخواه.",
			],
			en: [
				"Dynamic path mapping for monthly, seasonal, and yearly notes",
				"Processing optimization and significant plugin size reduction with better performance",
				"Fixed bugs and inconsistencies in Hijri date calculation",
				"Improved UI and responsive design for different screen sizes",
				"Improved 'Today' button to return to current date without creating extra notes",
				"Manual calendar update without needing to reopen the app",
				"Improved display and management of Iranian official occasions and holidays",
				"Added new command to replace meaningful expressions in any note",
			],
		},
	},
	{
		version: "3.0.2",
		changes: {
			fa: [
				"اضافه شدن مناسبت‌های تقویم رسمی ایران و نمایش در تقویم.",
				"اضافه شدن تقویم هجری قمری بر اساس تقویم ایران.",
				"اضافه شدن {{مناسبت}} برای غنی‌تر کردن نوشته‌ها بر اساس تنظیمات شما.",
				"امکان نمایش روزهای تعطیل در تقویم برای برنامه‌ریزی بهتر.",
				"بازطراحی نمایش امروز در تقویم برای دیده شدن بهتر با یک نگاه.",
				"اضافه شدن {{اول سال}} و {{آخر سال}} بر اساس سال‌نوشت.",
				"رفع باگ {{عبارت‌های معنادار}} و تداخل با Templater.",
				"پس از اولین فعال‌سازی، به صورت پیش‌فرض در هر بار راه‌اندازی برنامه نمایش داده می‌شود.",
			],
			en: [
				"Added Iranian official calendar occasions and display",
				"Added Hijri calendar based on Iran calendar",
				"Added {{مناسبت}} to enrich writings based on your settings",
				"Show holidays in calendar for better planning",
				"Redesigned today display for better visibility at a glance",
				"Added {{اول سال}} and {{آخر سال}} based on yearly note",
				"Fixed {{meaningful expressions}} conflict with Templater",
				"After first activation, displayed by default on every app startup",
			],
		},
	},
];
