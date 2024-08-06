import { Modal, App } from 'obsidian';

export default class UpdateModal extends Modal {
    constructor(app: App ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setAttribute('dir', 'rtl');
        contentEl.createEl('h3', { text: 'تغییرات نسخه 3.0 افزونه تقویم فارسی' });
        
        contentEl.createEl('p', { text: '- اضافه شدن رویدادهای تقویم رسمی ایران و نمایش در تقویم: حالا می‌توانید رویدادهای تقویم رسمی ایران را در تقویم خود مشاهده کنید.' });
        contentEl.createEl('p', { text: '- اضافه شدن تقویم هجری قمری بر اساس تقویم ایران: با این ویژگی می‌توانید تاریخ‌های هجری قمری را بر اساس تقویم ایران در تقویم مشاهده کنید. برای فعال‌سازی تنظیمات را بررسی کنید..' });
        contentEl.createEl('p', { text: '- اضافه شدن {{مناسبت}} برای غنی‌تر کردن نوشته‌ها بر اساس تنظیمات شما: از این به بعد می‌توانید از {{مناسبت}} برای اضافه کردن رویدادها به نوشته‌های خود استفاده کنید.' });
        contentEl.createEl('p', { text: '-  امکان نمایش روزهای تعطیل در تقویم: این ویژگی به شما اجازه می‌دهد تا روزهای تعطیل را در تقویم خود مشاهده کنید و بهتر برنامه‌ریزی کنید.' });
        contentEl.createEl('p', { text: '- بازطراحی نمایش امروز در تقویم: نمایش امروز در تقویم بهبود یافته و با یک نگاه بهتر شناسایی می‌شود.' });
        contentEl.createEl('p', { text: '- رفع باگ {{عبارت‌های معنادار}} و تداخل با تمپلیتر: باگ‌های مرتبط با {{عبارت‌های معنادار}} و تداخل با تمپلیتر رفع شده‌ است.' });        
        

        contentEl.createEl('p', { text: 'برای حمایت و بازخورد در مورد این افزونه کانال تلگرام کارفکر را دنبال کنید.' });        

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
