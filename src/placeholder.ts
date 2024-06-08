import { TFile  } from 'obsidian';
import moment from 'moment-jalaali';
import PersianCalendarPlugin from './main';

export default class PersianPlaceholders {
    plugin: PersianCalendarPlugin;  
    
    constructor(plugin: PersianCalendarPlugin) {
        this.plugin = plugin;
        
    }

    public async insertPersianDate(file: TFile): Promise<void> {
        if (!file) {
            console.error("File object is undefined.");
            return;
        }

        setTimeout(async () => {
            const fileContent = await this.plugin.app.vault.read(file);
            let updatedContent = fileContent;
            type PlaceholderValue = (() => Promise<string | null> | string | null) | string | null;

            const placeholders: { [key: string]: PlaceholderValue } = {
                '{{امروز}}': this.getPersianDate(),
                '{{این روز}}': this.getFormattedDateFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{روز هفته}}': this.getCurrentWeekday(),
                '{{این روز هفته}}': this.getWeekdayFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{هفته}}': this.getCurrentWeek(),
                '{{این هفته}}': this.getWeekNumberFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{ماه}}': this.getCurrentMonth(),
                '{{این ماه}}': this.getMonthNumberFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{فصل}}': this.getCurrentQuarter(),
                '{{این فصل}}': this.getQuarterNumberFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{سال}}': this.getCurrentYear(),
                '{{این سال}}': this.getYearNumberFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{روزهای گذشته}}': this.getDaysPassedFromFileTitle(file.basename, this.plugin.settings.dateFormat),
                '{{روزهای باقیمانده}}': this.getDaysUntilEndOfYear(file.basename, this.plugin.settings.dateFormat),
            };

           
            for (const [placeholder, value] of Object.entries(placeholders)) {
                if (fileContent.includes(placeholder)) {
                    const result = typeof value === 'function' ? await value() : value;
                    if (result != null) {  
                        updatedContent = updatedContent.replace(new RegExp(placeholder, 'g'), result);
                    }
                }
            }

           
            if (updatedContent !== fileContent) {
                await this.plugin.app.vault.modify(file, updatedContent);
            }
        }, 1250); 
    }

    private getJalaaliMoment(): moment.Moment {
        return moment().locale('fa');
    }

    private getPersianDate(): string {
        const now = this.getJalaaliMoment();
        return now.format('jYYYY-jMM-jDD');
    }
    
    private getCurrentWeekday(): string {
        const now = this.getJalaaliMoment();
        return now.format('dddd');
    }
    
    private getCurrentWeek(): string {
        const now = this.getJalaaliMoment();
        return `${now.jYear()}-W${now.jWeek()}`;
    }
    
    private getCurrentMonth(): string {
        const now = this.getJalaaliMoment();
        return `${now.jYear()}-${now.jMonth() + 1}`; 
    }
    
    private getCurrentQuarter(): string {
        const now = this.getJalaaliMoment();
        const quarter = Math.ceil((now.jMonth() + 1) / 3); 
        return `${now.jYear()}-Q${quarter}`;
    }
    
    private getCurrentYear(): string {
        const now = this.getJalaaliMoment();
        return `${now.jYear()}`;
    }

    private parseDateFromTitle(title: string, dateFormat: string): moment.Moment | null {
        let parsedDate = moment(title, dateFormat === 'persian' ? 'jYYYY-jMM-jDD' : 'YYYY-MM-DD');
        if (!parsedDate.isValid()) {
            console.error("Invalid date in file title");
            return null;
        }
        if (dateFormat === 'georgian') {
            const persianDate = parsedDate.locale('fa').format('jYYYY/jMM/jD');
            parsedDate = moment(persianDate, 'jYYYY/jMM/jD');
        }
        return parsedDate;
    }

    private getFormattedDateFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            return parsedDate.format('jYYYY-jMM-jDD');
        }
        return null;
    }
    
    private getWeekdayFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            return parsedDate.format('dddd'); 
        }
        return null;
    }
    
    private getWeekNumberFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            const jWeek = parsedDate.jWeek();
            const jYear = parsedDate.jYear();
            return `${jYear}-W${jWeek}`;
        }
        return null;
    }
    
    private getMonthNumberFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            const jMonth = parsedDate.jMonth() + 1;
            const jYear = parsedDate.jYear();
            return `${jYear}-${jMonth}`;
        }
        return null;
    }
    
    private getYearNumberFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            return `${parsedDate.jYear()}`;
        }
        return null;
    }
    
    private getQuarterNumberFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(title, dateFormat);
        if (parsedDate) {
            const jMonth = parsedDate.jMonth() + 1; 
            const quarter = Math.ceil(jMonth / 3);
            const jYear = parsedDate.jYear();
            return `${jYear}-Q${quarter}`;
        }
        return null;
    }
    private getDaysPassedFromFileTitle(title: string, dateFormat: string): string | null {
        try {
            let parsedDate;
            if (dateFormat === 'georgian') {
                parsedDate = moment(title, 'YYYY-MM-DD');
                if (parsedDate.isValid()) {
                    parsedDate = parsedDate.locale('fa'); 
                }
            } else {
                parsedDate = moment(title, 'jYYYY/jMM/jDD');
            }

            if (!parsedDate.isValid()) {
                console.error("Invalid date in file title");
                return null;
            }

            const startOfYear = moment(`${parsedDate.jYear()}/1/1`, 'jYYYY/jM/jD').locale('fa');
            const daysPassed = parsedDate.diff(startOfYear, 'days') + 1; 
            return daysPassed.toString();
        } catch (error) {
            console.error("Error calculating days passed: ", error);
            return null;
        }
    }
    private getDaysUntilEndOfYear(dateStr: string, dateFormat: string): string | null {
        const parsedDate = this.parseDateFromTitle(dateStr, dateFormat);
        if (parsedDate) {
            const endOfYear = moment(`${parsedDate.jYear()}/12/29`, 'jYYYY/jMM/jDD').locale('fa'); // Last day of the Persian year
            const daysUntilEnd = endOfYear.diff(parsedDate, 'days');
            return daysUntilEnd.toString();
        }
        return null;
    }

}

