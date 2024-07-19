import { TFile } from 'obsidian';
import moment from 'moment-jalaali';
import jalaali from 'jalaali-js';
import PersianCalendarPlugin from './main';
import { PersianCalendarHolidays, HijriCalendarHolidays, GregorianCalendarHolidays } from './holidays'; 
import hijriMoment from 'moment-hijri';




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

        const timeoutDuration = this.plugin.settings.timeoutDuration || 1250;

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
                '{{اول هفته}}': this.isWeeklyFile(file.basename) ? this.getWeekStartDate(parseInt(file.basename.split('-W')[0]), parseInt(file.basename.split('-W')[1]), this.plugin.settings.dateFormat) : null,
                '{{آخر هفته}}': this.isWeeklyFile(file.basename) ? this.getWeekEndDate(parseInt(file.basename.split('-W')[0]), parseInt(file.basename.split('-W')[1]), this.plugin.settings.dateFormat) : null,
                '{{اول ماه}}': this.isMonthlyFile(file.basename) ? this.getMonthStartDate(file.basename, this.plugin.settings.dateFormat) : null,
                '{{آخر ماه}}': this.isMonthlyFile(file.basename) ? this.getMonthEndDate(file.basename, this.plugin.settings.dateFormat) : null, 
                '{{رویداد}}': this.getEventsForPlaceholder(file.basename)       
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
        }, timeoutDuration);
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
            return null;
        }
        if (dateFormat === 'georgian') {
            const persianDate = parsedDate.locale('fa').format('jYYYY/jMM/jD');
            parsedDate = moment(persianDate, 'jYYYY/jMM/jD');
        }
        return parsedDate;
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
            const endOfYear = moment(`${parsedDate.jYear()}/12/29`, 'jYYYY/jMM/jDD').locale('fa');
            const daysUntilEnd = endOfYear.diff(parsedDate, 'days');
            return daysUntilEnd.toString();
        }
        return null;
    }

    private isWeeklyFile(title: string): boolean {
        const weeklyPattern = /^\d{4}-W\d{1,2}$/;
        return weeklyPattern.test(title);
    }

    getFirstSaturday(year: number): { jy: number, jm: number, jd: number } {
        const firstDayGregorian = jalaali.toGregorian(year, 1, 1);
        const firstDay = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
        const firstDayWeekday = firstDay.getDay();
        const offset = firstDayWeekday === 6 ? 0 : 6 - firstDayWeekday + 1;
        const firstSaturday = new Date(firstDay.getTime());
        firstSaturday.setDate(firstSaturday.getDate() + offset);
        return jalaali.toJalaali(firstSaturday.getFullYear(), firstSaturday.getMonth() + 1, firstSaturday.getDate());
    }

    getWeekStartDate(year: number, week: number, dateFormat: string): string {
        try {
            const firstDayOfYearGregorian = jalaali.toGregorian(year, 1, 1);
            const firstDayOfYear = new Date(firstDayOfYearGregorian.gy, firstDayOfYearGregorian.gm - 1, firstDayOfYearGregorian.gd);
            const firstDayWeekday = firstDayOfYear.getDay();
            const adjustedWeek = firstDayWeekday === 6 ? week : week - 1;

            const firstSaturday = this.getFirstSaturday(year);
            const startDate = jalaali.toGregorian(firstSaturday.jy, firstSaturday.jm, firstSaturday.jd);
            const start = new Date(startDate.gy, startDate.gm - 1, startDate.gd);
            start.setDate(start.getDate() + (adjustedWeek - 1) * 7);

            while (start.getDay() !== 6) {
                start.setDate(start.getDate() - 1);
            }
            const weekStartJalaali = jalaali.toJalaali(start.getFullYear(), start.getMonth() + 1, start.getDate());
            return this.formatDate(weekStartJalaali, dateFormat);
        } catch (error) {
            console.error('Error in getWeekStartDate:', error);
            throw error;
        }
    }

    getWeekEndDate(year: number, week: number, dateFormat: string): string {
        try {
            const weekStart = this.getWeekStartDate(year, week, 'persian');
            const [jy, jm, jd] = weekStart.split('-').map(Number);
            const startDateGregorian = jalaali.toGregorian(jy, jm, jd);
            const startDate = new Date(startDateGregorian.gy, startDateGregorian.gm - 1, startDateGregorian.gd);
            startDate.setDate(startDate.getDate() + 6);
            const weekEndJalaali = jalaali.toJalaali(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
            return this.formatDate(weekEndJalaali, dateFormat);
        } catch (error) {
            console.error('Error in getWeekEndDate:', error);
            throw error;
        }
    }

    formatDate(date: { jy: number, jm: number, jd: number }, dateFormat: string): string {
        if (dateFormat === 'persian') {
            return `${date.jy}-${date.jm.toString().padStart(2, '0')}-${date.jd.toString().padStart(2, '0')}`;
        } else {
            const gregorian = jalaali.toGregorian(date.jy, date.jm, date.jd);
            return `${gregorian.gy}-${gregorian.gm.toString().padStart(2, '0')}-${gregorian.gd.toString().padStart(2, '0')}`;
        }
    }

    private isMonthlyFile(title: string): boolean {
        const monthlyPattern = /^\d{4}-\d{2}$/;
        return monthlyPattern.test(title);
    }
    
    private getMonthStartDate(title: string, dateFormat: string): string | null {
        const [year, month] = title.split('-').map(Number);
        if (dateFormat === 'persian') {
            return `${year}-${month.toString().padStart(2, '0')}-01`;
        } else {
            const gregorianStart = jalaali.toGregorian(year, month, 1);
            return `${gregorianStart.gy}-${gregorianStart.gm.toString().padStart(2, '0')}-${gregorianStart.gd.toString().padStart(2, '0')}`;
        }
    }
    
    private getMonthEndDate(title: string, dateFormat: string): string | null {
        const [year, month] = title.split('-').map(Number);
        if (dateFormat === 'persian') {
            const jalaaliEndDay = jalaali.jalaaliMonthLength(year, month);
            return `${year}-${month.toString().padStart(2, '0')}-${jalaaliEndDay.toString().padStart(2, '0')}`;
        } else {
            const jalaaliEndDay = jalaali.jalaaliMonthLength(year, month);
            const gregorianEnd = jalaali.toGregorian(year, month, jalaaliEndDay);
            return `${gregorianEnd.gy}-${gregorianEnd.gm.toString().padStart(2, '0')}-${gregorianEnd.gd.toString().padStart(2, '0')}`;
        }
    }

    private getFormattedDateFromFileTitle(title: string, dateFormat: string): string | null {
        const parsedDate = moment(title, dateFormat);
        if (parsedDate.isValid()) {
            return parsedDate.format('jYYYY-jMM-jDD');
        }
        return null;
    }

    private getEventsForDate(jy: number, jm: number, jd: number): { title: string, isHoliday: boolean }[] {
        const events: { title: string, isHoliday: boolean }[] = [];
        const addEvent = (event: { title: string, isHoliday: boolean }) => events.push(event);

        // Persian Calendar Holidays
        if (this.plugin.settings.showOfficialIranianCalendar || this.plugin.settings.showAncientIranianCalendar) {
            PersianCalendarHolidays.forEach(event => {
                if (event.month === jm && event.day === jd) {
                    if (this.plugin.settings.showOfficialIranianCalendar && event.type === "Iran") {
                        addEvent({ title: event.title, isHoliday: event.holiday });
                    }
                    if (this.plugin.settings.showAncientIranianCalendar && event.type === "Ancient Iran") {
                        addEvent({ title: event.title, isHoliday: event.holiday });
                    }
                }
            });
        }

        // Hijri Calendar Holidays
        if (this.plugin.settings.showShiaCalendar) {
            const gregorianDate = jalaali.toGregorian(jy, jm, jd);
            const hijriDate = hijriMoment(`${gregorianDate.gy}-${gregorianDate.gm}-${gregorianDate.gd}`, 'YYYY-M-D').add(this.plugin.settings.hijriDateAdjustment, 'days');

            HijriCalendarHolidays.forEach(event => {
                if (event.month === hijriDate.iMonth() + 1 && event.day === hijriDate.iDate()) {
                    addEvent({ title: event.title, isHoliday: event.holiday });
                }
            });
        }

        // Gregorian Calendar Holidays
        if (this.plugin.settings.showOfficialIranianCalendar) {
            const gregorianDate = jalaali.toGregorian(jy, jm, jd);
            GregorianCalendarHolidays.forEach(event => {
                if (event.month === gregorianDate.gm && event.day === gregorianDate.gd) {
                    addEvent({ title: event.title, isHoliday: event.holiday });
                }
            });
        }

        return events;
    }

    private getEventsStringForDate(jy: number, jm: number, jd: number): string {
        const events = this.getEventsForDate(jy, jm, jd);
        if (events.length === 0) {
            return 'No events';
        }
        return events.map(event => `- ${event.title}`).join('\n');
    }

    private getEventsForPlaceholder(fileTitle: string): string {
        const formattedDate = this.getFormattedDateFromFileTitle(fileTitle, this.plugin.settings.dateFormat);
        if (formattedDate) {
            const [jy, jm, jd] = formattedDate.split('-').map(Number);
            return this.getEventsStringForDate(jy, jm, jd);
        }
        return 'No events';
    }


    

    
}


