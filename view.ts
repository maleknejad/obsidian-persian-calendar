import { WorkspaceLeaf, Notice, App, View, TFile,MarkdownView } from 'obsidian';
import { getTodayJalaali } from './calendar';
import { toJalaali, jalaaliMonthLength , toGregorian} from 'jalaali-js';
import type { PluginSettings , JalaaliDate } from './settings'; 
import moment from 'moment-jalaali';


export default class PersianCalendarView extends View {
    
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
    }
    getViewType(): string {
        return "persian-calendar";
    }

    getDisplayText(): string {
        return "Persian Calendar";
    }

    async onOpen(): Promise<void> {
        await this.render();
    }

    getIcon() {
        return 'calendar'; 
    }
    
    async onClose(): Promise<void> {
        console.log("Persian Calendar is closing");
    }
    private currentJalaaliYear: number;
    private currentJalaaliMonth: number;
    
    private settings: PluginSettings;

    private async render() {
        const containerEl = this.containerEl;
        containerEl.empty();
        
        await this.renderHeader(containerEl);

        // Create the main content container
        const contentEl = containerEl.createEl('div', { cls: 'calendar-content' });

        // Render the week numbers directly inside the content container
        await this.renderWeekNumbers(contentEl, this.getCurrentJalaaliDate()); // Pass contentEl and the current Jalaali date
    
        // Render the days grid directly inside the content container
        await this.renderDaysGrid(contentEl, this.getCurrentJalaaliDate()); // Pass contentEl and the current Jalaali date
    }
    
    private async renderHeader(containerEl: HTMLElement): Promise<void> {
        // Create the header container
        const headerEl = containerEl.createEl('div', { cls: 'calendar-header' });
    
        const nextMonthArrow = headerEl.createEl('span', { cls: 'calendar-change-month-arrow' });
        nextMonthArrow.textContent = '<';
        nextMonthArrow.addEventListener('click', () => this.changeMonth(1));
       
        // Create the "Today" button in the center
        const todayButton = headerEl.createEl('span', { cls: 'calendar-today-button' });
        todayButton.textContent = 'امروز';
        todayButton.addEventListener('click', () => this.goToToday());
    
        const prevMonthArrow = headerEl.createEl('span', { cls: 'calendar-change-month-arrow' });
        prevMonthArrow.textContent = '>';
        prevMonthArrow.addEventListener('click', () => this.changeMonth(-1));

    
        // Create the month and year display in the center
        const monthYearEl = headerEl.createEl('div', { cls: 'calendar-month-year' });

        // Create separate elements for month and year
        const monthEl = monthYearEl.createEl('span', { cls: 'calendar-month' });
        const yearEl = monthYearEl.createEl('span', { cls: 'calendar-year' });
    
        // Set the text content for month and year
        const monthName = this.getMonthName(this.currentJalaaliMonth);
        monthEl.textContent = monthName;
        yearEl.textContent = this.toFarsiDigits(this.currentJalaaliYear);
    
        // Add click listener for opening monthly note to the month element
        monthEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the event from bubbling to the parent element
            this.openOrCreateMonthlyNote(this.currentJalaaliMonth, this.currentJalaaliYear);
        });
    
        // Add click listener for opening yearly note to the year element
        yearEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the event from bubbling to the parent element
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
        const weeksWithNotes = await this.getWeeksWithNotes(jalaaliDate.jy); // Assumes this method is implemented
    
        for (let i = 0; i < 6; i++) {
            const weekEl = weekNumbersEl.createEl('div', { cls: 'calendar-week-number' });
    
            if (i < weekNumbers.length) {
                weekEl.textContent = this.toFarsiDigits(weekNumbers[i]);
                // Add visual indicator if the week has a note
                if (weeksWithNotes.includes(weekNumbers[i])) {
                    const dotEl = weekEl.createDiv({ cls: 'note-indicator' });
                    dotEl.setText('•'); // You can style this dot with CSS
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
        // Clear any existing grid and create a new one
        let gridEl = contentEl.querySelector('.calendar-days-grid');
        if (gridEl) {
            gridEl.remove();
        }
        gridEl = contentEl.createEl('div', { cls: 'calendar-days-grid' });
    
        // Define weekdays for the header
        const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

        // Create the weekdays header as part of the grid
        weekdays.forEach((weekday, index) => {
            if (gridEl === null) {
                console.error('gridEl is null');
                return; // Or handle the error as appropriate
            }
            const headerCell = gridEl.createEl('div', { cls: 'calendar-weekday-header' });
            headerCell.textContent = weekday;
            headerCell.style.gridColumnStart = (index + 2).toString();
        });
        // Retrieve days with notes
        const daysWithNotes = await this.getDaysWithNotes();
    
        // Use Jalaali date to get the first day of the month and the number of days in the month
        const daysInMonth = jalaaliMonthLength(jalaaliDate.jy, jalaaliDate.jm);
    
        // Calculate the index for the first day of the month (0 for Saturday, 1 for Sunday, ...)
        const firstDayOfWeekIndex = this.calculateFirstDayOfWeekIndex(jalaaliDate.jy, jalaaliDate.jm);
    
        // Define the total number of cells (6 weeks, 7 days a week)
        const totalCells = 42; // Fixed number of cells for a 6-row calendar
    
        // Calculate days from the previous and next months
        const daysFromPrevMonth = this.calculateDaysFromPreviousMonth(firstDayOfWeekIndex);
        const daysFromNextMonth = this.calculateDaysFromNextMonth(firstDayOfWeekIndex, daysInMonth);
    
        // Loop through total cells and create day elements
        for (let i = 0; i < totalCells; i++) {
            const dayEl = gridEl.createEl('div', { cls: 'calendar-day' });
            const dayIndex = i - firstDayOfWeekIndex; // Calculate index relative to the first day of the month
    
            // Assign day numbers or leave blank for cells outside the current month
            if (dayIndex < 0) {
                // Days from the previous month
                dayEl.textContent = this.toFarsiDigits(daysFromPrevMonth[daysFromPrevMonth.length + dayIndex]);
                dayEl.addClass('dim');
            } else if (dayIndex < daysInMonth) {
                // Days of the current month
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
                // Days from the next month
                dayEl.textContent = this.toFarsiDigits(daysFromNextMonth[dayIndex - daysInMonth]);
                dayEl.addClass('dim');
            }
            
   
            // Assign the day element to the correct grid column
            dayEl.style.gridColumnStart = ((i % 7) + 2).toString();
        }
    }
    

    private isToday(jalaaliDate: { jy: number, jm: number, jd: number }): boolean {
        // Using moment-jalaali to check if the given date is today
        const today = moment().locale('fa');
        return today.isSame(moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD'), 'day');
    }

    private async getDaysWithNotes(): Promise<number[]> {
        // Normalize the notes location path for consistent comparison
        const notesLocation = this.settings.dailyNotesFolderPath.trim().replace(/^\/*|\/*$/g, ""); // Remove leading and trailing slashes
        const filePrefix = notesLocation ? `${notesLocation}/` : ""; // Add a slash to the end if not root
    
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
        // Normalize the weekly notes location path for consistent comparison
        const notesLocation = this.settings.weeklyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePrefix = notesLocation ? `${notesLocation}/` : ""; // Add a slash to the end if not the root
    
        const files = this.app.vault.getFiles();
        const weekNumbers: number[] = files
            .filter(file => {
                // Build the start of the expected file name for weekly notes of the given year
                const expectedStart = `${filePrefix}${jy}-W`;
                return file.path.startsWith(expectedStart) && file.extension === 'md';
            })
            .map(file => {
                // Extract the week number from the file name
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
        // Convert the first day of the Jalaali month to Gregorian
        const { gy, gm, gd } = toGregorian(jy, jm, 1);
        // Create a Date object for the first day of the month in Gregorian
        const firstDayDate = new Date(gy, gm - 1, gd); // Note: JavaScript Date months are 0-indexed
        // Get the day of the week: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        const dayOfWeek = firstDayDate.getDay();
    
        // Adjust for a week starting on Saturday:
        // If getDay() returns 6 (Saturday), we want 0. For other days (Sun-Fri), we just add 1.
        const adjustedDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    
        return adjustedDayOfWeek;
    }
    
    private changeMonth(offset: number): void {
        // Adjust the current month and year based on the offset (-1 for previous, +1 for next)
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
    
        
        // After updating the month and year, re-render the calendar with the new month
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
        // Use the currently selected year and month, defaulting to today's date if not set
        const now = new Date();
        const todayJalaali = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        return { 
            jy: this.currentJalaaliYear || todayJalaali.jy,
            jm: this.currentJalaaliMonth || todayJalaali.jm,
            jd: 1  // Always use the first day of the month for this purpose
        };
    }

    private getWeekNumbersForMonth(jalaaliDate: {jy: number, jm: number}): number[] {
        // Ensure moment-jalaali uses the Jalaali calendar
        moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});
    
        // Start of the month for which we want to find the week numbers, in Jalaali
        const startOfMonth = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/1`, 'jYYYY/jM/jD');
        
        // Find out the Jalaali week number for the first day of the month
        const startWeekNumber = startOfMonth.jWeek();
    
        // Prepare an array to hold the week numbers for 6 weeks
        const weekNumbers = [];
    
        for (let i = 0; i < 6; i++) {
            // Calculate the week number for each week to be displayed
            let weekNumberForIthWeek = startWeekNumber + i;
            
            // Adjust week number for cases when it exceeds the number of weeks in a year
            if(weekNumberForIthWeek > 52) {
                weekNumberForIthWeek -= 52; // Assuming a maximum of 52 weeks per Jalaali year
            }
    
            // Push the calculated week number into the array
            weekNumbers.push(weekNumberForIthWeek);
        }
    
        return weekNumbers;
    }
    

    private async openOrCreateDailyNote(dayNumber: number) {
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
                // Attempt to find an open leaf with this file
                const openLeaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === dailyNoteFile);
                if (openLeaf) {
                    // File is already open, focus on it
                    this.app.workspace.setActiveLeaf(openLeaf);
                } else {
                    // File is not open, open it in a new pane
                    await this.app.workspace.openLinkText(dailyNoteFile.path, '', false);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error creating/opening daily note: ${error.message}`);
            } else {
                // Handle the case where the error is not an Error instance
                console.error("An unknown error occurred", error);
            }
        }
    }
    
    
    private async openOrCreateWeeklyNote(weekNumber: number, jy: number) {
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
                // Attempt to find an open leaf with this file
                const openLeaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === weeklyNoteFile);
                if (openLeaf) {
                    // File is already open, focus on it
                    this.app.workspace.setActiveLeaf(openLeaf);
                } else {
                    // File is not open, open it in a new pane
                    await this.app.workspace.openLinkText(weeklyNoteFile.path, '', false);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error creating/opening weekly note: ${error.message}`);
            } else {
                // Handle the case where the error is not an Error instance
                console.error("An unknown error occurred", error);
            }
        }
    }
    

    private async openOrCreateMonthlyNote(month: number, jy: number) {
        const monthString = `${jy}-${month.toString().padStart(2, '0')}`;
        const notesLocation = this.settings.monthlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${monthString}.md`;
    
        try {
            let monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
    
            if (!monthlyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created monthly note: ${filePath}`);
                // Re-fetch the file after creation to ensure it's not null
                monthlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            }
    
            if (monthlyNoteFile && monthlyNoteFile instanceof TFile) {
                this.openNoteInWorkspace(monthlyNoteFile);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error creating/opening daily note: ${error.message}`);
            } else {
                // Handle the case where the error is not an Error instance
                console.error("An unknown error occurred", error);
            }
        }
    }
    
    // Refactored openOrCreateYearlyNote
    private async openOrCreateYearlyNote(jy: number) {
        const yearString = `${jy}`;
        const notesLocation = this.settings.yearlyNotesFolderPath.trim().replace(/^\/*|\/*$/g, "");
        const filePath = `${notesLocation === '' ? '' : notesLocation + '/'}${yearString}.md`;
    
        try {
            let yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
    
            if (!yearlyNoteFile) {
                await this.app.vault.create(filePath, '');
                new Notice(`Created yearly note: ${filePath}`);
                // Re-fetch the file after creation to ensure it's not null
                yearlyNoteFile = await this.app.vault.getAbstractFileByPath(filePath);
            }
    
            if (yearlyNoteFile && yearlyNoteFile instanceof TFile) {
                this.openNoteInWorkspace(yearlyNoteFile);
                
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error creating/opening yearly note: ${error.message}`);
            } else {
                // Handle the case where the error is not an Error instance
                console.error("An unknown error occurred", error);
            }
        }
    }
    
    // Utility method to open or focus a note in the workspace
    private async openNoteInWorkspace(noteFile: TFile): Promise<void> {
    // Check if the note is already open in any leaf
    const isOpen = this.app.workspace.getLeavesOfType('markdown').some(leaf => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);

    if (isOpen) {
        // If open, find the leaf and activate it
        const leaf = this.app.workspace.getLeavesOfType('markdown').find(leaf => leaf.view instanceof MarkdownView && leaf.view.file === noteFile);
        if (leaf) {
            this.app.workspace.setActiveLeaf(leaf);
        }
    } else {
        // If not open, open the note in a new pane
        await this.app.workspace.openLinkText(noteFile.path, '', false);
    }
}

    private scrollToDay(dayNumber: number) {
        // Function to scroll to the specified day in the calendar
        const dayEl = this.containerEl.querySelector(`.calendar-day[data-day="${dayNumber}"]`);
        if (dayEl) {
            dayEl.scrollIntoView();
        }
    }

    private async goToToday() {
        // Function to navigate to the current day and open the daily note
        const { jy, jm, jd } = getTodayJalaali();
        this.currentJalaaliYear = jy;
        this.currentJalaaliMonth = jm;
        this.render();
        this.scrollToDay(jd);
    
        // Open or create the daily note for today
        this.openOrCreateDailyNote(jd);
    }
    private getMonthName(monthIndex: number): string {
        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return monthNames[monthIndex - 1]; // Adjusted if your monthIndex starts from 1
    }
}





