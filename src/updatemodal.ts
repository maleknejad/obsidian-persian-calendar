import { Modal, App } from 'obsidian';

export default class UpdateModal extends Modal {
    constructor(app: App ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setAttribute('dir', 'rtl');
        contentEl.createEl('h3', { text: 'تغییرات نسخه 2.1 افزونه تقویم فارسی' });
        
        contentEl.createEl('p', { text: 'اضافه شدن نمای میلادی به تقویم: حالا دیگر میتوانید همزمان از تقویم شمسی و میلادی استفاده کنید. روزهای میلادی زیر روزهای شمسی با فونت کوچکتر نمایش داده می‌شوند. ماه‌های مرتبط با ماه تقویم شمسی نیز در هدر نمایش داده می‌شود. اگر نیازی به این مورد نمی‌بینید میتوانید از تنظیمات افزونه غیرفعالش کنید.' });
        contentEl.createEl('p', { text: 'اضافه شدن تایم اوت برای {{عبارت‌های معنادار}}: اگر سیستم شما ضعیف است می‌توانید زمان فعال شدن افزونه پس از ساخته شدن فایل‌ها را بیشتر کنید.' });
        contentEl.createEl('p', { text: 'اضافه شدن چهار عبارت معنادار: میتوانید با درج {{اول هفته}} و {{آخر هفته}} در هفته‌نوشت یا {{اول ماه}} و {{آخر ماه}} در ماه‌نوشت روزهای مرتبط با این ماه را به تقویم انتخابی خودتان در تنظیمات (شمسی یا میلادی) برگردانید.' });
        
        contentEl.createEl('p', { text: 'کانال تلگرام کارفکر را برای پیگیری و مشارکت در توسعه مسیر افزونه دنبال کنید.' });
        
        const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });

        const button = buttonContainer.createEl('button', { text: 'کارفکر در تلگرام' });
        button.style.color = 'var(--interactive-accent)';
        button.style.backgroundColor = 'transparent'; 
        button.style.border = '1px solid var(--interactive-accent)';
        button.style.padding = '0.5em 1em'; 
        button.style.cursor = 'pointer'; 
        
        button.onclick = () => {
            window.open('https://t.me/karfekr', '_blank');
        };

        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '1em'; 
        
        contentEl.createEl('br');
    }
    
    onClose() {
        this.contentEl.empty();
        this.close();
    }
}
