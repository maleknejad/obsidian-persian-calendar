import { WorkspaceLeaf, Notice, App, View, TFile,MarkdownView } from 'obsidian';
import { getTodayJalaali } from './calendar';
import { toJalaali, jalaaliMonthLength , toGregorian} from 'jalaali-js';
import type { PluginSettings , JalaaliDate } from './settings'; 
import moment from 'moment-jalaali';


export default class PersianCalendarView extends View {
    dailyCheckInterval: number | undefined;
    lastCheckedDate: moment.Moment = moment().startOf('day');
    
    constructor(leaf: WorkspaceLeaf, app: App, settings: PluginSettings) {
        super(leaf);
        this.app = app;
        this.settings = settings;
        this.currentJalaaliYear = 0;
        this.currentJalaaliMonth = 0;
        this.loadCurrentMonth();
        const todayJalaali = toJalaali(new Date());
        this.currentJalaaliYear = todayJalaali.jy;
        this.currentJalaaliMonth = todayJalaali.jm;
        this.startDailyCheckInterval();
    }
    getViewType(): string {
        return "persian-calendar";
    }

    getDisplayText(): string {
        return "Persian Calendar";
    }

    async onOpen(): Promise<void> {
        await this.render();
        this.startDailyCheckInterval();
    }

    async onClose(): Promise<void> {
        this.stopDailyCheckInterval(); 
    }

    getIcon() {
        return 'calendar'; 
    }
    
    focus() {
        const inputEl = this.containerEl.querySelector('input');
        inputEl?.focus();
    }
    private currentJalaaliYear: number;
    private currentJalaaliMonth: number;
    
    private settings: PluginSettings;

    private async render() {
        const containerEl = this.containerEl;
        containerEl.empty();
        
        await this.renderHeader(containerEl);
        const contentEl = containerEl.createEl('div', { cls: 'calendar-content' });
        await this.renderWeekNumbers(contentEl, this.getCurrentJalaaliDate()); 
            await this.renderDaysGrid(contentEl, this.getCurrentJalaaliDate());
        if (this.settings.enableQuarterlyNotes) {
            await this.renderQuarterlyNotesRow(contentEl);
        }
    }
    
    private async renderHeader(containerEl: HTMLElement): Promise<void> {
         
        const headerEl = containerEl.createEl('div', { cls: 'calendar-header' });
    
        const nextMonthArrow = headerEl.createEl('span', { cls: 'calendar-change-month-arrow' });
        nextMonthArrow.textContent = '<';
        nextMonthArrow.addEventListener('click', () => this.changeMonth(1));
       
        const todayButton = headerEl.createEl('span', { cls: 'calendar-today-button' });
        todayButton.textContent = 'امروز';
        todayButton.addEventListener('click', () => this.goToToday());
    
        const prevMonthArrow = headerEl.createEl('span', { cls: 'calendar-change-month-arrow' });
        prevMonthArrow.textContent = '>';
        prevMonthArrow.addEventListener('click', () => this.changeMonth(-1));
        const monthYearEl = headerEl.createEl('div', { cls: 'calendar-month-year' });
        const monthEl = monthYearEl.createEl('span', { cls: 'calendar-month' });
        const yearEl = monthYearEl.createEl('span', { cls: 'calendar-year' });    
        const monthName = this.getMonthName(this.currentJalaaliMonth);
        monthEl.textContent = monthName;
        yearEl.textContent = this.toFarsiDigits(this.currentJalaaliYear);

        monthEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openOrCreateMonthlyNote(this.currentJalaaliMonth, this.currentJalaaliYear);
        });
    
         
        yearEl.addEventListener('click', (e) => {
            e.stopPropagation(); 
            this.openOrCreateYearlyNote(this.currentJalaaliYear);
        });
    
    }
    
    private async renderWeekNumbers(contentEl: HTMLElement, jalaaliDate: { jy: number, jm: number }) {
        let weekNumbersEl = contentEl.querySelector('.calendar-week-numbers');
        if (weekNumbersEl) {
            weekNumbersEl.remove();
        }
    
        weekNumbersEl = contentEl.createEl('div', { cls: 'calendar-week-numbers' });
        const weekHeader = weekNumbersEl.createEl('div', { cls: 'calendar-week-header' });
        weekHeader.textContent = "ه";
    
        const weekNumbers = this.getWeekNumbersForMonth(jalaaliDate);
        const weeksWithNotes = await this.getWeeksWithNotes(jalaaliDate.jy);  
    
        for (let i = 0; i < 6; i++) {
            const weekEl = weekNumbersEl.createEl('div', { cls: 'calendar-week-number' });
    
            if (i < weekNumbers.length) {
                weekEl.textContent = this.toFarsiDigits(weekNumbers[i]);
                 
                if (weeksWithNotes.includes(weekNumbers[i])) {
                    const dotEl = weekEl.createDiv({ cls: 'note-indicator' });
                    dotEl.setText('•');  
                }
    
                weekEl.addEventListener('click', async () => {
                    await this.openOrCreateWeeklyNote(weekNumbers[i], jalaaliDate.jy);
                });
            } else {
                weekEl.textContent = "";
            }
        }
    }
    
    
    
    
    private async renderDaysGrid(contentEl: HTMLElement, jalaaliDate: { jy: number, jm: number }) {
         
        let gridEl = contentEl.querySelector('.calendar-days-grid');
        if (gridEl) {
            gridEl.remove();
        }
        gridEl = contentEl.createEl('div', { cls: 'calendar-days-grid' });
    
         
        const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

        weekdays.forEach((weekday, index) => {
            if (!gridEl) {
                new Notice('Calendar grid element not found. Please ensure the calendar is properly loaded.');
                return;  
            }
            const headerCell = gridEl.createEl('div', { cls: 'calendar-weekday-header' });
            headerCell.textContent = weekday;
            headerCell.classList.add("dynamic-grid-placement");  
            headerCell.style.setProperty('--dynamic-grid-start', (index + 2).toString());
        });
         
        const daysWithNotes = await this.getDaysWithNotes();
        const daysInMonth = jalaaliMonthLength(jalaaliDate.jy, jalaaliDate.jm);
        const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jalaaliDate.jy, jalaaliDate.jm);
        const totalCells = 42;  
        const daysFromPrevMonth = this.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
        const daysFromNextMonth = this.calculateDaysFromNextMonth(firstDayOfWeekIndex, daysInMonth);
        for (let i = 0; i < totalCells; i++) {
            const dayEl = gridEl.createEl('div', { cls: 'calendar-day' });
            const dayIndex = i - firstDayOfWeekIndex;       
            if (dayIndex < 0) {
                dayEl.textContent = this.toFarsiDigits(daysFromPrevMonth[daysFromPrevMonth.length + dayIndex]);
                dayEl.addClass('dim');
            } else if (dayIndex < daysInMonth) {
                 
                const dayNumber = dayIndex + 1;
                dayEl.textContent = this.toFarsiDigits(dayNumber);
                if (this.isToday({ jy: jalaaliDate.jy, jm: jalaaliDate.jm, jd: dayNumber })) {
                    dayEl.addClass('today');
                }
                if (daysWithNotes.includes(dayNumber)) {
                    const dotEl = dayEl.createEl('div', { cls: 'note-indicator' });
                    dotEl.setText('•');
                }
                if (dayIndex >= 0 && dayIndex < daysInMonth) {
                    dayEl.addEventListener('click', () => {
                        this.openOrCreateDailyNote(dayNumber);
                    });
                }
                
            } else {
                 
                dayEl.textContent = this.toFarsiDigits(daysFromNextMonth[dayIndex - daysInMonth]);
                dayEl.addClass('dim');
            }
            dayEl.classList.add("dynamic-day-grid-placement"); 
            dayEl.style.setProperty('--day-grid-start', ((i % 7) + 2).toString());
        }
    }

    private async renderQuarterlyNotesRow(containerEl: HTMLElement) {    
        const quartersRow = containerEl.createDiv({ cls: 'calendar-quarters-row' });
        const { quarter: currentQuarter, jy } = this.getCurrentQuarter();
        const seasons = ['بهار', 'تابستان', 'پاییز', 'زمستان'];
        seasons.forEach((season, index) => {  
            const quarterDiv = quartersRow.createDiv({
                cls: `calendar-quarter${index + 1 === currentQuarter ? ' current-quarter' : ''}`
            });
            quarterDiv.textContent = season;  
            quarterDiv.addEventListener('click', () => {
                const quarterNumber = index + 1;
                this.openOrCreateQuarterlyNote(quarterNumber, jy);
            });
        });
    } 

    private startDailyCheckInterval(): void {
        this.dailyCheckInterval = setInterval(() => {
            const today = moment().startOf('day');
            if (!this.lastCheckedDate.isSame(today, 'day')) {
                this.lastCheckedDate = today;
                this.render();  
            }
        }, 60 * 1000) as unknown as number; 
    }

    private stopDailyCheckInterval(): void {
        if (this.dailyCheckInterval !== undefined) {
            clearInterval(this.dailyCheckInterval);
            this.dailyCheckInterval = undefined;
        }
    }
    

    private isToday(jalaaliDate: { jy: number, jm: number, jd: number }): boolean {
         
        const today = moment().locale('fa');
        return today.isSame(moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD'), 'day');
    }

    private async getDaysWithNotes(): Promise<number[]> {
         
        const notesLocation = this.settings.dailyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");  
        const filePrefix = notesLocation ? `${notesLocation}/` : "";  
    
        const files = this.app.vault.getFiles();
        const noteDays: number[] = files
            .filter(file => {
                const filePath = `${filePrefix}${this.currentJalaaliYear}-${this.currentJalaaliMonth.toString().padStart(2, '0')}`;
                return file.path.startsWith(filePath) && file.extension === 'md';
            })
            .map(file => {
                const parts = file.name.split('-');
                return parts.length === 3 ? parseInt(parts[2].replace('.md', ''), 10) : null;
            })
            .filter(day => day !== null) as number[];
    
        return noteDays;
    }

    
    private async getWeeksWithNotes(jy: number): Promise<number[]> {
         
        const notesLocation = this.settings.weeklyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePrefix = notesLocation ? `${notesLocation}/` : "";  
    
        const files = this.app.vault.getFiles();
        const weekNumbers: number[] = files
            .filter(file => {
                 
                const expectedStart = `${filePrefix}${jy}-W`;
                return file.path.startsWith(expectedStart) && file.extension === 'md';
            })
            .map(file => {
                 
                const match = file.name.match(/W(\d+)/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(weekNumber => weekNumber !== null) as number[];
    
        return weekNumbers;
    }

    private toFarsiDigits(num: number | string): string {
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => farsiDigits[parseInt(digit, 10)]);
    }
    
    private calculateFirstDayOfWeekIndex(jy: number, jm: number): number {
         
        const { gy, gm, gd } = toGregorian(jy, jm, 1);
         
        const firstDayDate = new Date(gy, gm - 1, gd);  
         
        const dayOfWeek = firstDayDate.getDay();
    
         
         
        const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    
        return adjustedDayOfWeek;
    }
    
    private changeMonth(offset: number): void {
        let newMonth = this.currentJalaaliMonth + offset;
        let newYear = this.currentJalaaliYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        this.currentJalaaliMonth = newMonth;
        this.currentJalaaliYear = newYear;
        this.render(); 
    }
  

    private calculateDaysFromPreviousMonth(firstDayOfWeek: number): number[] {
        const previousMonth = this.currentJalaaliMonth === 1 ? 12 : this.currentJalaaliMonth - 1;
        const previousYear = this.currentJalaaliMonth === 1 ? this.currentJalaaliYear - 1 : this.currentJalaaliYear;
        const lastDayOfPreviousMonth = jalaaliMonthLength(previousYear, previousMonth);
        const daysFromPrevMonth: number[] = [];

        const daysToInclude = firstDayOfWeek;

        for (let i = lastDayOfPreviousMonth - daysToInclude + 1; i <= lastDayOfPreviousMonth; i++) {
            daysFromPrevMonth.push(i);
        }

        return daysFromPrevMonth;
    }

    private calculateDaysFromNextMonth(firstDayOfWeek: number, currentMonthLength: number): number[] {

        const daysFromNextMonth: number[] = [];

        const daysToInclude = 6 * 7 - currentMonthLength - firstDayOfWeek;

        for (let i = 1; i <= daysToInclude; i++) {
            daysFromNextMonth.push(i);
        }

        return daysFromNextMonth;
    }


    private async loadCurrentMonth() {
        const { jy, jm } = getTodayJalaali();
        this.currentJalaaliYear = jy;
        this.currentJalaaliMonth = jm;
    }

    

    private getCurrentJalaaliDate(): JalaaliDate {
         
        const now = new Date();
        const todayJalaali = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        return { 
            jy: this.currentJalaaliYear || todayJalaali.jy,
            jm: this.currentJalaaliMonth || todayJalaali.jm,
            jd: 1   
        };
    }

    private getWeekNumbersForMonth(jalaaliDate: {jy: number, jm: number}): number[] {
        moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});
        const startOfMonth = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/1`, 'jYYYY/jM/jD');        
        const startWeekNumber = startOfMonth.jWeek();
        const weekNumbers = [];
    
        for (let i = 0; i < 6; i++) {
            let weekNumberForIthWeek = startWeekNumber + i;
            
            if(weekNumberForIthWeek > 52) {
                weekNumberForIthWeek -= 52; 
            }
    
            weekNumbers.push(weekNumberForIthWeek);
        }
    
        return weekNumbers;
    }
    
    private calculateCurrentWeekNumber(jalaaliDate: {jy: number, jm: number, jd: number}): number {
    moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});

    const currentDate = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD');

    const currentWeekNumber = currentDate.jWeek();

    return currentWeekNumber;
}

    public async openOrCreateDailyNote(dayNumber: number) {
        const year = this.currentJalaaliYear;
        const month = this.currentJalaaliMonth;
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
        const notesLocation = this.settings.dailyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${dateString}.md`;
    
        try {
            let dailyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            if (!dailyNoteFile) {
                await this.app.vault.create(filePath, '');
                dailyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
                new Notice(`Created daily note: ${filePath}`);
                this.render();
            }
    
            if (dailyNoteFile && dailyNoteFile instanceof TFile) {
                 
                const openLeaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === dailyNoteFile);
                if (openLeaf) {
                     
                    this.app.workspace.setActiveLeaf(openLeaf);
                } else {
                     
                    await this.app.workspace.openLinkText(dailyNoteFile.path, '', false);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                new Notice ('Error creating/opening daily note');
            } else {
                 
                new Notice ('Error creating/opening daily note');
            }
        }
    }
    
    
    public async openOrCreateWeeklyNote(weekNumber: number, jy: number) {
        const weekString = `${jy}-W${weekNumber}`;
        const notesLocation = this.settings.weeklyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${weekString}.md`;
    
        try {
            let weeklyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
    
            if (!weeklyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created weekly note: ${filePath}`);
                weeklyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
                this.render();
            }
    
            if (weeklyNoteFile && weeklyNoteFile instanceof TFile) {
                 
                const openLeaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === weeklyNoteFile);
                if (openLeaf) {
                     
                    this.app.workspace.setActiveLeaf(openLeaf);
                } else {
                     
                    await this.app.workspace.openLinkText(weeklyNoteFile.path, '', false);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                new Notice('Error creating/opening weekly note');
            } else {
                new Notice('Error creating/opening weekly note');
            }
        }
    }
    

    public async openOrCreateMonthlyNote(month: number, jy: number) {
        const monthString = `${jy}-${month.toString().padStart(2, '0')}`;
        const notesLocation = this.settings.monthlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${monthString}.md`;
    
        try {
            let monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
    
            if (!monthlyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created monthly note: ${filePath}`);
                 
                monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            }
    
            if (monthlyNoteFile && monthlyNoteFile instanceof TFile) {
                this.openNoteInWorkspace(monthlyNoteFile);
            }
        } catch (error) {
            if (error instanceof Error) {
                new Notice('Error creating/opening daily note');
            } else {
                 
                new Notice('an error accured!');
            }
        }
    }
    
    public async openOrCreateQuarterlyNote(quarter: number, jy: number) {
         
        const quarterString = `${jy}-Q${quarter}`;
         
        const notesLocation = this.settings.quarterlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${quarterString}.md`;
        
        try {
            let quarterlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            
             
            if (!quarterlyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created quarterly note: ${filePath}`);
                 
                quarterlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            }
            
             
            if (quarterlyNoteFile && quarterlyNoteFile instanceof TFile) {
                this.openNoteInWorkspace(quarterlyNoteFile);
            }
        } catch (error) {
             
            if (error instanceof Error) {
                new Notice(`Error creating/opening quarterly note: ${error.message}`);
            } else {
                new Notice('An unknown error occurred while handling the quarterly note');
            }
        }
    }
    

    public async openOrCreateYearlyNote(jy: number) {
        const yearString = `${jy}`;
        const notesLocation = this.settings.yearlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${yearString}.md`;
    
        try {
            let yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
    
            if (!yearlyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created yearly note: ${filePath}`);
                 
                yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            }
    
            if (yearlyNoteFile && yearlyNoteFile instanceof TFile) {
                this.openNoteInWorkspace(yearlyNoteFile);
                
            }
        } catch (error) {
            if (error instanceof Error) {
                new Notice('Error creating/opening yearly note');
            } else {
                 
                new Notice('An unknown error occurred');
            }
        }
    }
    
     
    private async openNoteInWorkspace(noteFile: TFile): Promise<void> {
     
    const isOpen = this.app.workspace.getLeavesOfType('markdown').some(leaf => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);

    if (isOpen) {
         
        const leaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);
        if (leaf) {
            this.app.workspace.setActiveLeaf(leaf);
        }
    } else {
         
        await this.app.workspace.openLinkText(noteFile.path, '', false);
    }
}

    private scrollToDay(dayNumber: number) {
         
        const dayEl = this.containerEl.querySelector(`.calendar-day[data-day="${dayNumber}"]`);
        if (dayEl) {
            dayEl.scrollIntoView();
        }
    }

    private async goToToday() {
         
        const { jy, jm, jd } = getTodayJalaali();
        this.currentJalaaliYear = jy;
        this.currentJalaaliMonth = jm;
        this.render();
        this.scrollToDay(jd);
    
         
        this.openOrCreateDailyNote(jd);
    }

    public getCurrentQuarter(): { quarter: number, jy: number } {
        const month = this.currentJalaaliMonth; 
        const year = this.currentJalaaliYear; 
        let quarter = 1;
    
        if (month >= 1 && month <= 3) quarter = 1; 
        else if (month >= 4 && month <= 6) quarter = 2; 
        else if (month >= 7 && month <= 9) quarter = 3; 
        else if (month >= 10 && month <= 12) quarter = 4; 
    
        return { quarter, jy: year };
    }
    
    private getMonthName(monthIndex: number): string {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return monthNames[monthIndex - 1];  
    }
}





