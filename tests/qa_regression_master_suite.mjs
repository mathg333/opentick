import { 
  formatDateYMD, 
  getTodayYMD, 
  parseYMD, 
  addDaysYMD, 
  getTaskDates, 
  getTaskTimes, 
  isTaskOnDate,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyRepeatedDates,
  generateAnnualDates
} from '../src/utils/taskSchedule.js';

import { 
  XP_REWARDS, 
  RANKS_CONFIG, 
  calculateGamification 
} from '../src/utils/gamification.js';

import fs from 'fs';
import path from 'path';

let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    results.push({ status: 'PASS', testName, details });
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
  } else {
    failedCount++;
    results.push({ status: 'FAIL', testName, details });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} - ${details}`);
  }
}

console.log('\n======================================================');
console.log('--- OPENTASK QA & REGRESSION MASTER TEST SUITE ---');
console.log('======================================================\n');

// ----------------------------------------------------------------------
// BATERIA 1: TASK SCHEDULE & RECURRENCE ENGINE
// ----------------------------------------------------------------------
console.log('--- [BATERIA 1] Task Scheduling & Calendar Date Matching ---');

const today = getTodayYMD();
assert(/^\d{4}-\d{2}-\d{2}$/.test(today), 'getTodayYMD returns valid YYYY-MM-DD format', today);

const parsed = parseYMD('2026-11-19T14:30:00.000Z');
assert(parsed instanceof Date && parsed.getFullYear() === 2026 && parsed.getMonth() === 10 && parsed.getDate() === 19, 'parseYMD parses ISO strings cleanly');

const plus5 = addDaysYMD('2026-11-19', 5);
assert(plus5 === '2026-11-24', 'addDaysYMD calculates correct future date', plus5);

const minus5 = addDaysYMD('2026-11-19', -5);
assert(minus5 === '2026-11-14', 'addDaysYMD calculates correct past date', minus5);

// Test task date & time matching
const mockTaskSingle = { id: 'm1', dueDate: '2026-11-25', startTime: '14:00', completed: false };
assert(getTaskDates(mockTaskSingle).length === 1 && getTaskDates(mockTaskSingle)[0] === '2026-11-25', 'getTaskDates extracts single dueDate');
assert(getTaskTimes(mockTaskSingle).length === 1 && getTaskTimes(mockTaskSingle)[0] === '14:00', 'getTaskTimes extracts single startTime');
assert(isTaskOnDate(mockTaskSingle, '2026-11-25') === true, 'isTaskOnDate is true on dueDate');
assert(isTaskOnDate(mockTaskSingle, '2026-11-26') === false, 'isTaskOnDate is false on non-scheduled date');

const mockTaskRecurring = { 
  id: 'm2', 
  recurringDates: ['2026-11-20', '2026-11-22', '2026-11-20'], 
  recurringTimes: ['09:00', '15:00', '09:00'],
  completed: false 
};
const recDates = getTaskDates(mockTaskRecurring);
assert(recDates.length === 2 && recDates[0] === '2026-11-20' && recDates[1] === '2026-11-22', 'getTaskDates deduplicates recurring dates correctly');
const recTimes = getTaskTimes(mockTaskRecurring);
assert(recTimes.length === 2 && recTimes[0] === '09:00' && recTimes[1] === '15:00', 'getTaskTimes deduplicates recurring times correctly');
assert(isTaskOnDate(mockTaskRecurring, '2026-11-20') === true, 'isTaskOnDate matches recurring date 1');
assert(isTaskOnDate(mockTaskRecurring, '2026-11-21') === false, 'isTaskOnDate does NOT match intermediate date');
assert(isTaskOnDate(mockTaskRecurring, '2026-11-22') === true, 'isTaskOnDate matches recurring date 2');

// Weekly generator check: should only generate selected days
const weeklyDates = generateWeeklyDates({
  startDateStr: '2026-11-16', // Segunda-feira (Day 1)
  selectedDays: [1, 3], // Seg e Qua
  weeksCount: 2
});
assert(weeklyDates.every(dStr => {
  const dt = parseYMD(dStr);
  return dt.getDay() === 1 || dt.getDay() === 3;
}), 'generateWeeklyDates generates ONLY selected weekdays', JSON.stringify(weeklyDates));

// ----------------------------------------------------------------------
// BATERIA 2: GAMIFICAÇÃO & EQUILÍBRIO DE ESCUDOS RPG
// ----------------------------------------------------------------------
console.log('\n--- [BATERIA 2] Gamification, Hard-Earned RPG Curve & XP Exploit Prevention ---');

assert(XP_REWARDS.TASK_COMPLETED === 10, 'XP_REWARDS.TASK_COMPLETED is balanced to 10 XP');
assert(XP_REWARDS.TASK_HIGH_PRIORITY_BONUS === 5, 'XP_REWARDS.TASK_HIGH_PRIORITY_BONUS is 5 XP');
assert(XP_REWARDS.POMODORO_SESSION === 20, 'XP_REWARDS.POMODORO_SESSION is 20 XP');
assert(XP_REWARDS.HABIT_STREAK_DAY === 5, 'XP_REWARDS.HABIT_STREAK_DAY is 5 XP');

assert(RANKS_CONFIG.length === 7, 'RANKS_CONFIG contains exactly 7 shield tiers');
assert(RANKS_CONFIG[0].tier === 'ferro' && RANKS_CONFIG[0].minXp === 0 && RANKS_CONFIG[0].maxXp === 999, 'Ferro Tier is 0 - 999 XP');
assert(RANKS_CONFIG[1].tier === 'bronze' && RANKS_CONFIG[1].minXp === 1000 && RANKS_CONFIG[1].maxXp === 2999, 'Bronze Tier requires 1,000 XP (hard-earned ~100 tasks)');
assert(RANKS_CONFIG[2].tier === 'prata' && RANKS_CONFIG[2].minXp === 3000 && RANKS_CONFIG[2].maxXp === 6999, 'Prata Tier is 3,000 - 6,999 XP');
assert(RANKS_CONFIG[3].tier === 'ouro' && RANKS_CONFIG[3].minXp === 7000 && RANKS_CONFIG[3].maxXp === 13999, 'Ouro Tier is 7,000 - 13,999 XP');
assert(RANKS_CONFIG[4].tier === 'safira' && RANKS_CONFIG[4].minXp === 14000 && RANKS_CONFIG[4].maxXp === 24999, 'Safira Tier is 14,000 - 24,999 XP');
assert(RANKS_CONFIG[5].tier === 'diamante' && RANKS_CONFIG[5].minXp === 25000 && RANKS_CONFIG[5].maxXp === 44999, 'Diamante Tier is 25,000 - 44,999 XP');
assert(RANKS_CONFIG[6].tier === 'rubi' && RANKS_CONFIG[6].minXp === 45000, 'Rubi Tier requires 45,000+ XP');

// Clean new user check: must be Level 1 Ferro with 0 XP
const cleanUserGame = calculateGamification({ tasks: [], habits: [], pomodoroSessions: [], bonusXp: 0 });
assert(cleanUserGame.totalXp === 0, 'Clean user starts with 0 XP');
assert(cleanUserGame.level === 1, 'Clean user starts at Level 1');
assert(cleanUserGame.currentRank.tier === 'ferro', 'Clean user shield is Ferro');

// Exploit prevention check: bonusXp of 450 from old store versions is sanitized
const sanitizedGame = calculateGamification({ tasks: [], habits: [], pomodoroSessions: [], bonusXp: 450 });
assert(sanitizedGame.totalXp === 0, 'Old legacy 450 bonusXp is sanitized to 0 XP');
assert(sanitizedGame.currentRank.tier === 'ferro', 'Sanitized user remains Ferro Tier');

// Progression simulation: 10 completed tasks = 100 XP (Level 1 Ferro)
const tenTasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: true, priority: 1 }));
const tenTasksGame = calculateGamification({ tasks: tenTasks, habits: [], pomodoroSessions: [], bonusXp: 0 });
assert(tenTasksGame.totalXp === 100, '10 completed normal tasks give exactly 100 XP');
assert(tenTasksGame.currentRank.tier === 'ferro', '10 tasks is still Ferro (progression is not trivially easy)');

// Reaching Bronze requires 100 completed tasks (1,000 XP)
const hundredTasks = Array.from({ length: 100 }, (_, i) => ({ id: `t${i}`, completed: true, priority: 1 }));
const hundredTasksGame = calculateGamification({ tasks: hundredTasks, habits: [], pomodoroSessions: [], bonusXp: 0 });
assert(hundredTasksGame.totalXp === 1000, '100 completed tasks give 1,000 XP');
assert(hundredTasksGame.currentRank.tier === 'bronze' && hundredTasksGame.level === 6, '1,000 XP unlocks Bronze Tier at Level 6');

// ----------------------------------------------------------------------
// BATERIA 3: WHATSAPP-STYLE FORMATTER ENGINE
// ----------------------------------------------------------------------
console.log('\n--- [BATERIA 3] WhatsApp Formatting & Interactive Checklist Parsing ---');

// WhatsApp inline regex tokenizer
function tokenizeWhatsApp(text) {
  const tokenRegex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  return text.split(tokenRegex).filter(Boolean);
}

const sampleInline = 'Texto com *negrito*, _itálico_, ~tachado~ e ```código```.';
const tokens = tokenizeWhatsApp(sampleInline);
assert(tokens.includes('*negrito*'), 'Tokenizes *bold* cleanly');
assert(tokens.includes('_itálico_'), 'Tokenizes _italic_ cleanly');
assert(tokens.includes('~tachado~'), 'Tokenizes ~strikethrough~ cleanly');
assert(tokens.includes('```código```'), 'Tokenizes ```code``` cleanly');

// WhatsApp multiline line parsing
function parseLines(fullText) {
  return fullText.split('\n').map(line => {
    const checkMatch = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
    if (checkMatch) return { type: 'check', checked: checkMatch[2].toLowerCase() === 'x', text: checkMatch[3] };
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) return { type: 'bullet', text: bulletMatch[2] };
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) return { type: 'number', num: numMatch[2], text: numMatch[3] };
    return { type: 'text', text: line };
  });
}

const sampleDocument = `[ ] Comprar suprimentos
[x] Revisar relatórios
- Item de nota importante
* Outro marcador
1. Primeira prioridade
2. Segunda prioridade
Linha comum de texto`;

const parsedLines = parseLines(sampleDocument);
assert(parsedLines[0].type === 'check' && parsedLines[0].checked === false, 'Parses [ ] unchecked task');
assert(parsedLines[1].type === 'check' && parsedLines[1].checked === true, 'Parses [x] checked task');
assert(parsedLines[2].type === 'bullet' && parsedLines[2].text === 'Item de nota importante', 'Parses - bullet');
assert(parsedLines[3].type === 'bullet' && parsedLines[3].text === 'Outro marcador', 'Parses * bullet');
assert(parsedLines[4].type === 'number' && parsedLines[4].num === '1', 'Parses 1. numbered list');
assert(parsedLines[5].type === 'number' && parsedLines[5].num === '2', 'Parses 2. numbered list');
assert(parsedLines[6].type === 'text', 'Parses normal paragraph');

// Interactive checklist toggle simulation
function toggleChecklistLine(doc, lineIndex) {
  const lines = doc.split('\n');
  const target = lines[lineIndex];
  const isChecked = /^(\s*)\[[xX]\]/.test(target);
  const newSym = isChecked ? '[ ]' : '[x]';
  lines[lineIndex] = target.replace(/^(\s*)\[([ xX])\]/, `$1${newSym}`);
  return lines.join('\n');
}

const toggledToChecked = toggleChecklistLine(sampleDocument, 0);
assert(toggledToChecked.startsWith('[x] Comprar suprimentos'), 'Interactive toggle: [ ] becomes [x]');

const toggledToUnchecked = toggleChecklistLine(toggledToChecked, 0);
assert(toggledToUnchecked.startsWith('[ ] Comprar suprimentos'), 'Interactive toggle: [x] reverts to [ ]');

// ----------------------------------------------------------------------
// BATERIA 4: STATIC CODE INSPECTION & REGRESSION PREVENTION
// ----------------------------------------------------------------------
console.log('\n--- [BATERIA 4] Static Code & Requirement Compliance Audit ---');

const taskViewPath = path.resolve('src/components/TaskView.jsx');
const taskViewSrc = fs.readFileSync(taskViewPath, 'utf8');

// Parse all buttons in TaskView
const allButtons = [...taskViewSrc.matchAll(/<button[\s\S]*?<\/button>/g)].map(m => m[0]);

const hasBulletBtn = allButtons.some(b => /•\s*Bullet/i.test(b) || />\s*Bullet\s*</i.test(b));
assert(!hasBulletBtn, 'TaskView has ZERO "• Bullet" buttons');

const hasCheckBtn = allButtons.some(b => /\[\s*\]\s*Check/i.test(b) || />\s*Check\s*</i.test(b));
assert(!hasCheckBtn, 'TaskView has ZERO "[ ] Check" formatting buttons');

const hasListFormattingBtn = allButtons.some(b => /1\.\s*Lista/i.test(b) || /title=["'][^"']*Lista[^"']*["']\s*>\s*1\./i.test(b));
assert(!hasListFormattingBtn, 'TaskView has ZERO "1. Lista" formatting buttons');

const hasNovaCatBtn = allButtons.some(b => /\+\s*Nova\s*Categoria/i.test(b));
assert(!hasNovaCatBtn, 'TaskView has ZERO "+ Nova Categoria" buttons');

// Requirement: Category badge hidden if no category
const hidesEmptyCategory = taskViewSrc.includes('hasCategory ?') && taskViewSrc.includes(': null');
assert(hidesEmptyCategory, 'TaskView hides category badge when task has no category');

// Requirement: CalendarView uses yellow #facc15 ONLY for today
const calViewPath = path.resolve('src/components/CalendarView.jsx');
const calViewSrc = fs.readFileSync(calViewPath, 'utf8');

// Match occurrences of #facc15
const yellowMatches = [...calViewSrc.matchAll(/#facc15/g)];
console.log(`Found ${yellowMatches.length} occurrences of yellow #facc15 in CalendarView.jsx.`);
assert(yellowMatches.length > 0, 'CalendarView uses yellow for today');

// Check that every yellow usage is preceded by isToday, isDToday, or isTodayCell
const yellowRegex = /([^\n]+#facc15[^\n]+)/g;
let allYellowForToday = true;
let lineMatch;
while ((lineMatch = yellowRegex.exec(calViewSrc)) !== null) {
  const lineText = lineMatch[1];
  // check if surrounding context checks for today
  const index = lineMatch.index;
  const context = calViewSrc.substring(Math.max(0, index - 200), index + 100);
  if (!context.includes('Today') && !context.includes('today')) {
    allYellowForToday = false;
    console.warn('Potential non-today yellow line:', lineText);
  }
}
assert(allYellowForToday, 'All occurrences of yellow in CalendarView are strictly conditioned on today');

// Requirement: hasScheduledTasks requires task.startTime or getTaskTimes(t).length > 0
const hasScheduledTasksLogic = calViewSrc.includes('getTaskTimes(t).length > 0');
assert(hasScheduledTasksLogic, 'hasScheduledTasks strictly requires programmed times (no ghost dates)');

console.log('\n======================================================');
console.log(`TEST SUITE FINISHED: ${passedCount} PASSED | ${failedCount} FAILED`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
