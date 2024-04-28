/* eslint-disable no-case-declarations */
import {EditorSuggest, EditorPosition, Editor, EditorSuggestTriggerInfo, EditorSuggestContext, TFile, MarkdownView, Notice} from 'obsidian';
import { toJalaali } from 'jalaali-js';
import PersianCalendarPlugin from './main';
import moment from 'moment-jalaali';

export default class DateSuggester extends EditorSuggest<string> {
    plugin: PersianCalendarPlugin;  

    constructor(plugin: PersianCalendarPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
        const line = editor.getLine(cursor.line);
        const atIndex = line.lastIndexOf('@', cursor.ch);
        if (atIndex !== -1 && atIndex < cursor.ch) {
            return {
                start: { line: cursor.line, ch: atIndex },
                end: cursor,
                query: line.substring(atIndex + 1, cursor.ch)
            };
        }
        return null;
    }

    public calculateCurrentWeekNumber(jalaaliDate: {jy: number, jm: number, jd: number}): number {
        moment.loadPersian({usePersianDigits: false, dialect: 'persian-modern'});
        const currentDate = moment(`${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`, 'jYYYY/jM/jD');
        const currentWeekNumber = currentDate.jWeek();
        return currentWeekNumber;
    }

    getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
        const query = context.query.toLowerCase();
        const suggestions = ['امروز','فردا', 'دیروز', 'پریروز', 'پس‌فردا',
                            'شنبه', 'شنبه بعد', 'شنبه قبل',
                            'یکشنبه', 'یکشنبه بعد', 'یکشنبه قبل',
                            'دوشنبه', 'دوشنبه بعد', 'دوشنبه قبل',
                            'سه‌شنبه', 'سه‌شنبه بعد', 'سه‌شنبه قبل',
                            'چهارشنبه', 'چهارشنبه بعد', 'چهارشنبه قبل',
                            'پنج‌شنبه', 'پنج‌شنبه بعد', 'پنج‌شنبه قبل',
                            'جمعه', 'جمعه بعد', 'جمعه قبل'
                            ,'این هفته', 'هفته قبل', 'هفته بعد', 
                            'این ماه', 'ماه قبل', 'ماه بعد',
                            'این فصل', 'فصل قبل', 'فصل بعد',
                            'امسال', 'سال قبل', 'سال بعد'];
        return suggestions.filter(suggestion => suggestion.startsWith(query));
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        const suggestionSpan = el.createSpan();
        suggestionSpan.textContent = value.charAt(0).toUpperCase() + value.slice(1); 
    }

    getFormattedDateLink(keyword: string, date: Date ) {
        const now = new Date();
        let dateText = '';
        const formatDate = (date: Date) => {
            const jalaaliDate = toJalaali(date);
            if (this.plugin.settings.dateFormat === 'georgian') {
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            } else {
                return `${jalaaliDate.jy}-${jalaaliDate.jm.toString().padStart(2, '0')}-${jalaaliDate.jd.toString().padStart(2, '0')}`;
            }
        };
    
        const formatWeek = (date: Date) => {
            const jalaaliDate = toJalaali(date);
            const weekNumber = this.calculateCurrentWeekNumber(jalaaliDate);
            return `${jalaaliDate.jy}-W${weekNumber.toString().padStart(1, '0')}`;
        };
    
        const formatMonth = (date: Date) => {
            const jalaaliDate = toJalaali(date);
            return `${jalaaliDate.jy}-${jalaaliDate.jm.toString().padStart(2, '0')}`;
        };
    
        const formatQuarter = (date: Date) => {
            const jalaaliDate = toJalaali(date);
            let quarterNum = 1;
            const month = jalaaliDate.jm;
            if (month >= 1 && month <= 3) quarterNum = 1;
            else if (month >= 4 && month <= 6) quarterNum = 2;
            else if (month >= 7 && month <= 9) quarterNum = 3;
            else if (month >= 10 && month <= 12) quarterNum = 4;   
            return `${jalaaliDate.jy}-Q${quarterNum}`;
        };
    
        const formatYear = (date: Date) => {
            const jalaaliDate = toJalaali(date);
            return `${jalaaliDate.jy}`;
        };

        const weekdayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
        const regex = /(دوشنبه|یکشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|شنبه|جمعه)( بعد| قبل)?/;
        const match = keyword.match(regex);
    
        if (match) {
            const weekdayName = match[1]; 
            const specifier = match[2] || ""; 
            const weekdayIndex = weekdayNames.indexOf(weekdayName);
            const currentDayOfWeek = now.getDay(); 
            const daysFromNowToWeekday = (weekdayIndex + 6 - currentDayOfWeek) % 7;
    
            if (specifier.includes("بعد")) {
                now.setDate(now.getDate() + daysFromNowToWeekday + 7); 
            } else if (specifier.includes("قبل")) {
                now.setDate(now.getDate() + daysFromNowToWeekday - 7); 
            } else {
                now.setDate(now.getDate() + daysFromNowToWeekday); 
            }   
            dateText = formatDate(now);
            const formatSpecifier = specifier ? ` ${specifier.trim()}` : '';
            return `[[${dateText}|${weekdayName}${formatSpecifier}]]`;
        } else {
        switch (keyword) {
            default:
            return '[تاریخ شناسایی نشد! برای مشاهده راهنما کلیک کنید](https://github.com/maleknejad/obsidian-persian-calendar) ';
            case 'امروز':
            case 'فردا':
            case 'دیروز':
            case 'پریروز':
            case 'پس‌فردا':
                const dateAdjustment = {
                    'امروز': 0,
                    'فردا': 1,
                    'دیروز': -1,
                    'پریروز': -2,
                    'پس‌فردا': 2,
                }[keyword];
                date.setDate(date.getDate() + dateAdjustment);
                return `[[${formatDate(date)}|${keyword}]]`;
    
            case 'این هفته':
                return `[[${formatWeek(new Date())}|${keyword}]]`;
    
            case 'هفته قبل':
                return `[[${formatWeek(new Date(new Date().setDate(new Date().getDate() - 7)))}|${keyword}]]`;
    
            case 'هفته بعد':
                return `[[${formatWeek(new Date(new Date().setDate(new Date().getDate() + 7)))}|${keyword}]]`;
    
            case 'این ماه':
                return `[[${formatMonth(new Date())}|${keyword}]]`;
    
            case 'ماه قبل':
                return `[[${formatMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)))}|${keyword}]]`;
    
            case 'ماه بعد':
                return `[[${formatMonth(new Date(new Date().setMonth(new Date().getMonth() + 1)))}|${keyword}]]`;
    
            case 'این فصل':
                return `[[${formatQuarter(new Date())}|${keyword}]]`;
    
            case 'فصل قبل':
                return `[[${formatQuarter(new Date(new Date().setMonth(new Date().getMonth() - 3)))}|${keyword}]]`;
    
            case 'فصل بعد':
                return `[[${formatQuarter(new Date(new Date().setMonth(new Date().getMonth() + 3)))}|${keyword}]]`;
    
            case 'امسال':
                return `[[${formatYear(new Date())}|${keyword}]]`;
    
            case 'سال قبل':
                return `[[${formatYear(new Date(new Date().setFullYear(new Date().getFullYear() - 1)))}|${keyword}]]`;
    
            case 'سال بعد':
                return `[[${formatYear(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}|${keyword}]]`;
        }
    }
    }
    

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        const now = new Date();
        const linkText = this.getFormattedDateLink(value, now);  // Ensures linkText is always a string
    
        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            if (this.context && this.context.start && this.context.end) {
                editor.replaceRange(linkText, this.context.start, this.context.end);
            } else {
                console.error('EditorSuggest context start or end is null');
            }
        } else {
            console.error('No active markdown editor');
        }
        this.close(); 
    }
    convertTextToDate(editor: Editor) {
        const selectedText = editor.getSelection();
    
        if (!selectedText) {
            new Notice('متنی انتخاب نشده است.');
            return;
        }
    
        let linkText = '';
    
        try {
            linkText = this.getFormattedDateLink(selectedText, new Date());
    
            editor.replaceSelection(linkText); // Replace the selected text with the formatted date link
        } catch (error) {
            console.error('Failed to convert text to date:', error);
            new Notice('Failed to convert text to date.');
        }
    }


    
}
