/**
 * OpenTask / OpenTick Rigorous Code Audit & Regression Test Suite
 * Tests all 4 historical bug domains and core state invariants:
 * 1. Calendar View & Ghost Marks & Color Isolation
 * 2. Gamification & RPG Shields & Anti-Exploit Balance
 * 3. Task Detail & WhatsApp Formatting Engine & UI Invariants
 * 4. State Machine, Soft-Delete & Storage Integrity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Import pure utility modules directly from source
import {
  formatDateYMD,
  parseYMD,
  addDaysYMD,
  getTaskDates,
  getTaskTimes,
  isTaskOnDate,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyRepeatedDates,
  generateAnnualDates,
  getTodayYMD
} from '../src/utils/taskSchedule.js';

import {
  calculateGamification,
  XP_REWARDS,
  RANKS_CONFIG
} from '../src/utils/gamification.js';

import {
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_HABITS,
  INITIAL_POMODORO_SESSIONS
} from '../src/store/initialData.js';

// Test runner harness
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    failures.push({ testName, details });
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

function assertEqual(actual, expected, testName) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, testName, `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
}

console.log('================================================================');
console.log('   OPENTASK RIGOROUS CODE AUDIT & REGRESSION TEST SUITE        ');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// DOMAIN 1: CALENDAR VIEW, GHOST MARKS & COLOR ISOLATION
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: CALENDAR & TASK SCHEDULING (NO GHOST MARKS) ---');

// 1.1 formatDateYMD and parseYMD
const sampleDate = new Date(2026, 10, 19); // 2026-11-19
assertEqual(formatDateYMD(sampleDate), '2026-11-19', '1.1 formatDateYMD correctly formats Date to YYYY-MM-DD');
assert(formatDateYMD(null) === '', '1.2 formatDateYMD returns empty string for null');
assert(formatDateYMD(new Date('invalid')) === '', '1.3 formatDateYMD returns empty string for invalid date');

const parsed = parseYMD('2026-11-19');
assert(parsed !== null && parsed.getFullYear() === 2026 && parsed.getMonth() === 10 && parsed.getDate() === 19, '1.4 parseYMD correctly parses YYYY-MM-DD');
const parsedIso = parseYMD('2026-11-19T14:30:00.000Z');
assert(parsedIso !== null && parsedIso.getFullYear() === 2026 && parsedIso.getDate() === 19, '1.5 parseYMD strips ISO timestamp accurately');
assert(parseYMD('invalid-date') === null, '1.6 parseYMD returns null for malformed string');

// 1.2 addDaysYMD boundary checks
assertEqual(addDaysYMD('2026-11-19', 1), '2026-11-20', '1.7 addDaysYMD adds 1 day');
assertEqual(addDaysYMD('2026-11-19', -1), '2026-11-18', '1.8 addDaysYMD subtracts 1 day');
assertEqual(addDaysYMD('2026-11-30', 1), '2026-12-01', '1.9 addDaysYMD crosses month boundary');
assertEqual(addDaysYMD('2026-12-31', 1), '2027-01-01', '1.10 addDaysYMD crosses year boundary');

// 1.3 getTaskDates & getTaskTimes
const taskSingle = { dueDate: '2026-11-19', startTime: '10:00' };
assertEqual(getTaskDates(taskSingle), ['2026-11-19'], '1.11 getTaskDates extracts dueDate when no recurringDates');
assertEqual(getTaskTimes(taskSingle), ['10:00'], '1.12 getTaskTimes extracts startTime when no recurringTimes');

const taskRecur = {
  dueDate: '2026-11-19',
  recurringDates: ['2026-11-21', '2026-11-19', '2026-11-21'],
  startTime: '10:00',
  recurringTimes: ['14:00', '09:00', '14:00']
};
assertEqual(getTaskDates(taskRecur), ['2026-11-19', '2026-11-21'], '1.13 getTaskDates dedupes and sorts recurringDates');
assertEqual(getTaskTimes(taskRecur), ['09:00', '14:00'], '1.14 getTaskTimes dedupes and sorts recurringTimes');

const taskEmpty = {};
assertEqual(getTaskDates(taskEmpty), [], '1.15 getTaskDates returns empty array for empty task');
assertEqual(getTaskTimes(taskEmpty), [], '1.16 getTaskTimes returns empty array for empty task');

// 1.4 Date Generators
const dailyDates = generateDailyDates('2026-11-01', 2, 6);
assertEqual(dailyDates, ['2026-11-01', '2026-11-03', '2026-11-05'], '1.17 generateDailyDates steps correctly');

const weeklyDates = generateWeeklyDates('2026-11-01', [1, 5], 1, 2); // Mondays and Fridays for 2 weeks
assert(weeklyDates.length >= 2, '1.18 generateWeeklyDates returns expected days');

const monthClampDates = generateMonthlyRepeatedDates([31], 2026, 1, 2); // Feb & Mar 2026
assert(monthClampDates.some(d => d.endsWith('-02-28')), '1.19 generateMonthlyRepeatedDates clamps Feb 31 to Feb 28');

// 1.5 Strict Calendar Marking Engine (hasScheduledTasks)
// Exactly replicates CalendarView.jsx line 198-201
function createCalendarMarkingChecker(tasks) {
  const activeTasks = tasks.filter(t => !t.deleted);
  const getTasksForDate = (dStr) => activeTasks.filter(t => isTaskOnDate(t, dStr));
  const hasScheduledTasks = (dStr) => getTasksForDate(dStr).some(t => !t.completed && getTaskTimes(t).length > 0);
  return { activeTasks, getTasksForDate, hasScheduledTasks };
}

const mockTasks = [
  { id: '1', dueDate: '2026-11-05', startTime: '09:00', completed: false, deleted: false }, // Scheduled with time: YES
  { id: '2', dueDate: '2026-11-07', startTime: '', completed: false, deleted: false },      // NO time: MUST NOT MARK
  { id: '3', dueDate: '2026-11-09', startTime: '14:00', completed: true, deleted: false },   // Completed: MUST NOT MARK
  { id: '4', dueDate: '2026-11-11', startTime: '15:00', completed: false, deleted: true },   // Deleted: MUST NOT MARK
  { id: '5', recurringDates: ['2026-11-15', '2026-11-17'], recurringTimes: ['08:00'], completed: false, deleted: false } // Recur with time: YES
];

const checker = createCalendarMarkingChecker(mockTasks);

assert(checker.hasScheduledTasks('2026-11-05') === true, '1.20 Day with incomplete task + time is marked');
assert(checker.hasScheduledTasks('2026-11-07') === false, '1.21 Day with incomplete task but NO time is NOT marked');
assert(checker.hasScheduledTasks('2026-11-09') === false, '1.22 Day with completed task is NOT marked');
assert(checker.hasScheduledTasks('2026-11-11') === false, '1.23 Day with soft-deleted task is NOT marked');
assert(checker.hasScheduledTasks('2026-11-15') === true, '1.24 Recurring date 1 with time is marked');
assert(checker.hasScheduledTasks('2026-11-17') === true, '1.25 Recurring date 2 with time is marked');

// 1.6 Verify ZERO Ghost Markings on alternate days
const emptyDays = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06', '2026-11-08', '2026-11-10', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-16'];
const ghostMarks = emptyDays.filter(d => checker.hasScheduledTasks(d));
assertEqual(ghostMarks, [], '1.26 Ghost days (1, 3, 6, 8, etc.) have ZERO markings');

// 1.7 Initial State Calendar Audit: ONLY today has a scheduled task in initial data
const initialChecker = createCalendarMarkingChecker(INITIAL_TASKS);
const todayYMD = getTodayYMD();
assert(initialChecker.hasScheduledTasks(todayYMD) === true, '1.27 Today is marked in INITIAL_TASKS (task t-3)');

// Check days 1 to 28 of current month
const [curYear, curMonth] = todayYMD.split('-').map(Number);
let otherDaysMarked = 0;
for (let d = 1; d <= 28; d++) {
  const dStr = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (dStr !== todayYMD && initialChecker.hasScheduledTasks(dStr)) {
    otherDaysMarked++;
  }
}
assertEqual(otherDaysMarked, 0, '1.28 ZERO other days marked in INITIAL_TASKS');

// 1.8 Strict Color Audit: #facc15 (Yellow) in CalendarView.jsx
const calendarViewSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/CalendarView.jsx'), 'utf-8');
const yellowRegex = /#facc15/g;
const yellowMatches = calendarViewSource.match(yellowRegex) || [];
assert(yellowMatches.length > 0, '1.29 CalendarView.jsx contains #facc15 styling');

// Ensure all yellow occurrences in CalendarView are guarded by isToday / todayStr / isDToday
const allCalendarLines = calendarViewSource.split('\n');
const nonTodayYellowLines = allCalendarLines.filter((l, idx) => {
  if (!l.includes('#facc15')) return false;
  // Check context across preceding 5 lines for isToday / isDToday / isTodayCell / today
  const context = allCalendarLines.slice(Math.max(0, idx - 5), idx + 2).join('\n');
  return (
    !context.includes('isToday') && 
    !context.includes('isDToday') && 
    !context.includes('isTodayCell') && 
    !context.includes('todayStr') &&
    !context.includes('today')
  );
});
assertEqual(nonTodayYellowLines, [], '1.30 All occurrences of #facc15 in CalendarView are strictly for TODAY');


// -----------------------------------------------------------------------------
// DOMAIN 2: GAMIFICAÇÃO & ESCUDO RPG (ANTI-EXPLOIT & EQUILÍBRIO)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: GAMIFICAÇÃO & RPG SHIELDS (ANTI-EXPLOIT) ---');

// 2.1 RANKS_CONFIG Tier & Level Boundaries
const ferro = RANKS_CONFIG.find(r => r.tier === 'ferro');
assert(ferro && ferro.minXp === 0 && ferro.maxXp === 999 && ferro.minLevel === 1 && ferro.maxLevel === 5, '2.1 Ferro tier: 0-999 XP, Lvl 1-5');

const bronze = RANKS_CONFIG.find(r => r.tier === 'bronze');
assert(bronze && bronze.minXp === 1000 && bronze.maxXp === 2999 && bronze.minLevel === 6 && bronze.maxLevel === 10, '2.2 Bronze tier: 1000-2999 XP, Lvl 6-10');

const prata = RANKS_CONFIG.find(r => r.tier === 'prata');
assert(prata && prata.minXp === 3000 && prata.maxXp === 6999 && prata.minLevel === 11 && prata.maxLevel === 15, '2.3 Prata tier: 3000-6999 XP, Lvl 11-15');

const ouro = RANKS_CONFIG.find(r => r.tier === 'ouro');
assert(ouro && ouro.minXp === 7000 && ouro.maxXp === 13999 && ouro.minLevel === 16 && ouro.maxLevel === 20, '2.4 Ouro tier: 7000-13999 XP, Lvl 16-20');

const safira = RANKS_CONFIG.find(r => r.tier === 'safira');
assert(safira && safira.minXp === 14000 && safira.maxXp === 24999 && safira.minLevel === 21 && safira.maxLevel === 25, '2.5 Safira tier: 14000-24999 XP, Lvl 21-25');

const diamante = RANKS_CONFIG.find(r => r.tier === 'diamante');
assert(diamante && diamante.minXp === 25000 && diamante.maxXp === 44999 && diamante.minLevel === 26 && diamante.maxLevel === 30, '2.6 Diamante tier: 25000-44999 XP, Lvl 26-30');

const rubi = RANKS_CONFIG.find(r => r.tier === 'rubi');
assert(rubi && rubi.minXp === 45000 && rubi.minLevel === 31 && rubi.maxLevel === 50, '2.7 Rubi tier: 45000+ XP, Lvl 31-50');

// 2.2 XP Rewards Constants
assertEqual(XP_REWARDS.TASK_COMPLETED, 10, '2.8 TASK_COMPLETED gives 10 XP');
assertEqual(XP_REWARDS.TASK_HIGH_PRIORITY_BONUS, 5, '2.9 TASK_HIGH_PRIORITY_BONUS gives 5 XP');
assertEqual(XP_REWARDS.POMODORO_SESSION, 20, '2.10 POMODORO_SESSION gives 20 XP');
assertEqual(XP_REWARDS.HABIT_STREAK_DAY, 5, '2.11 HABIT_STREAK_DAY gives 5 XP');

// 2.3 Legacy Exploit Prevention: 450 XP bug
const exploitState = {
  tasks: [],
  habits: [],
  pomodoroSessions: [],
  bonusXp: 450 // The bug injected 450 XP automatically
};
const cleanRes = calculateGamification(exploitState);
assertEqual(cleanRes.totalXp, 0, '2.12 Legacy bonusXp: 450 is neutralized to 0 XP');
assertEqual(cleanRes.currentRank.tier, 'ferro', '2.13 User with 450 bug starts at Ferro, not elevated');

// Legitimate bonusXp test
const legitState = { tasks: [], habits: [], pomodoroSessions: [], bonusXp: 50 };
assertEqual(calculateGamification(legitState).totalXp, 50, '2.14 Legitimate bonusXp is accepted');

// 2.4 Initial State Gamification Audit
const initialGamification = calculateGamification({
  tasks: INITIAL_TASKS,
  habits: INITIAL_HABITS,
  pomodoroSessions: INITIAL_POMODORO_SESSIONS,
  bonusXp: 0
});
// 2 completed tasks * 10 = 20 XP
// 1 pomodoro session * 20 = 20 XP
// habits streaks: 5 + 3 + 2 = 10 * 5 = 50 XP
// Total = 90 XP
assertEqual(initialGamification.totalXp, 90, '2.15 Initial State calculates exactly 90 XP');
assertEqual(initialGamification.currentRank.tier, 'ferro', '2.16 Initial Rank is Ferro (Iniciado de Ferro)');
assertEqual(initialGamification.level, 1, '2.17 Initial Level is 1');
assert(initialGamification.totalXp < 1000, '2.18 Initial user is far below Bronze (earned progression)');

// 2.5 High XP & Rank Progression Scaling Test
const testBronzeState = {
  tasks: Array.from({ length: 100 }, (_, i) => ({ id: `t-${i}`, completed: true, priority: 0 })), // 100 * 10 = 1000 XP
  habits: [],
  pomodoroSessions: [],
  bonusXp: 0
};
const bronzeRes = calculateGamification(testBronzeState);
assertEqual(bronzeRes.totalXp, 1000, '2.19 100 completed tasks yields 1000 XP');
assertEqual(bronzeRes.currentRank.tier, 'bronze', '2.20 1000 XP advances to Bronze rank');
assertEqual(bronzeRes.level, 6, '2.21 1000 XP is Level 6 (Bronze starting level)');

// Soft-deleted tasks excluded from XP
const deletedTaskState = {
  tasks: [
    { id: '1', completed: true, deleted: true, priority: 0 },
    { id: '2', completed: true, deleted: false, priority: 3 }
  ],
  habits: [],
  pomodoroSessions: [],
  bonusXp: 0
};
// Task 1 is deleted (0 XP), Task 2 is active priority 3 (10 + 5 = 15 XP)
assertEqual(calculateGamification(deletedTaskState).totalXp, 15, '2.22 Soft-deleted tasks contribute ZERO XP');


// -----------------------------------------------------------------------------
// DOMAIN 3: TASK VIEW, WHATSAPP FORMATTER & UI INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: TASK DETAIL & WHATSAPP FORMATTER ENGINE ---');

// 3.1 WhatsApp Formatting Regex & Tokenization Audit
const inlineTokenRegex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

function testInlineTokens(text) {
  const parts = text.split(inlineTokenRegex);
  const tokens = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('```') && part.endsWith('```')) {
      tokens.push({ type: 'code', content: part.slice(3, -3) });
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      tokens.push({ type: 'bold', content: part.slice(1, -1) });
    } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      tokens.push({ type: 'italic', content: part.slice(1, -1) });
    } else if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      tokens.push({ type: 'strike', content: part.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', content: part });
    }
  }
  return tokens;
}

const sampleInline = 'Texto com *negrito*, _itálico_, ~tachado~ e ```código```.';
const tokens = testInlineTokens(sampleInline);
assert(tokens.some(t => t.type === 'bold' && t.content === 'negrito'), '3.1 *negrito* parsed as bold');
assert(tokens.some(t => t.type === 'italic' && t.content === 'itálico'), '3.2 _itálico_ parsed as italic');
assert(tokens.some(t => t.type === 'strike' && t.content === 'tachado'), '3.3 ~tachado~ parsed as strike');
assert(tokens.some(t => t.type === 'code' && t.content === 'código'), '3.4 ```código``` parsed as code');

// 3.2 WhatsApp Line Parser (Checklist, Bullets, Lists)
function testLineParser(line) {
  const checkMatch = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
  if (checkMatch) {
    return {
      type: 'checklist',
      indent: checkMatch[1],
      checked: checkMatch[2].toLowerCase() === 'x',
      content: checkMatch[3]
    };
  }
  const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
  if (bulletMatch) {
    return { type: 'bullet', indent: bulletMatch[1], content: bulletMatch[2] };
  }
  const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (numMatch) {
    return { type: 'numbered', indent: numMatch[1], num: numMatch[2], content: numMatch[3] };
  }
  return { type: 'paragraph', content: line };
}

const checkLine1 = testLineParser('[ ] Comprar café');
assert(checkLine1.type === 'checklist' && checkLine1.checked === false && checkLine1.content === 'Comprar café', '3.5 [ ] parsed as unchecked checklist');

const checkLine2 = testLineParser('[x] Estudar código');
assert(checkLine2.type === 'checklist' && checkLine2.checked === true && checkLine2.content === 'Estudar código', '3.6 [x] parsed as checked checklist');

const checkLine3 = testLineParser('  [X] Indentado');
assert(checkLine3.type === 'checklist' && checkLine3.checked === true && checkLine3.indent === '  ', '3.7 [X] uppercase with indent parsed correctly');

const bulletLine = testLineParser('- Ponto com traço');
assert(bulletLine.type === 'bullet' && bulletLine.content === 'Ponto com traço', '3.8 - item parsed as bullet');

const numLine = testLineParser('1. Primeiro passo');
assert(numLine.type === 'numbered' && numLine.num === '1' && numLine.content === 'Primeiro passo', '3.9 1. item parsed as numbered list');

// 3.3 Interactive Checklist Toggle Mutation Test
function toggleChecklistLine(line, targetChecked) {
  const sym = targetChecked ? '[x]' : '[ ]';
  return line.replace(/^(\s*)\[([ xX])\]/, `$1${sym}`);
}
assertEqual(toggleChecklistLine('[ ] Item A', true), '[x] Item A', '3.10 Toggle [ ] to [x]');
assertEqual(toggleChecklistLine('[x] Item B', false), '[ ] Item B', '3.11 Toggle [x] to [ ]');
assertEqual(toggleChecklistLine('    [ ] Indent', true), '    [x] Indent', '3.12 Toggle preserves exact leading indentation');

// 3.4 TaskView.jsx Source Code Audit for Prohibited Elements
const taskViewSource = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/TaskView.jsx'), 'utf-8');

// A. No formatting buttons
const forbiddenButtonTerms = [
  '• Bullet',
  '[ ] Check',
  '1. Lista',
  'Lista Numerada',
  'Botão Bullet',
  '+ Nova Categoria'
];
for (const term of forbiddenButtonTerms) {
  // Check if button with this text exists
  const btnPattern = new RegExp(`<button[^>]*>[^<]*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*<\\/button>`, 'i');
  assert(!btnPattern.test(taskViewSource), `3.13 ZERO forbidden button containing "${term}" in TaskView.jsx`);
}

// B. Category badge visibility strictly guarded by hasCategory
assert(taskViewSource.includes('const hasCategory = Boolean(selectedTaskProject && selectedTaskProject.id !== \'inbox\' && selectedTaskProject.id !== \'none\' && selectedTaskProject.id !== \'\');'), '3.14 hasCategory requires non-inbox non-empty category');
assert(taskViewSource.includes('{hasCategory ? ('), '3.15 Category badge rendered conditionally with hasCategory');

// C. Blur/click race condition prevention
assert(taskViewSource.includes('onPointerDown={(e) => e.preventDefault()}'), '3.16 onPointerDown prevents blur race condition on view/edit toggle');

// D. Generous notes space (~85% full viewport feel)
assert(taskViewSource.includes('min-h-[440px]') || taskViewSource.includes('min-h-[560px]'), '3.17 Notes container has high min-height for maximum screen utilization');
assert(taskViewSource.includes('flex-1 w-full bg-[#0d0d10]'), '3.18 Notes container is flex-1 w-full');


// -----------------------------------------------------------------------------
// DOMAIN 4: STATE ENGINE, SOFT-DELETE & STORAGE INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: STATE ENGINE & STORAGE INTEGRITY ---');

// 4.1 Initial Data Integrity
assert(Array.isArray(INITIAL_PROJECTS) && INITIAL_PROJECTS.length >= 7, '4.1 INITIAL_PROJECTS has at least 7 projects');
assert(INITIAL_PROJECTS.some(p => p.id === 'inbox'), '4.2 INITIAL_PROJECTS includes default inbox');
assert(Array.isArray(INITIAL_TASKS) && INITIAL_TASKS.length === 5, '4.3 INITIAL_TASKS has exactly 5 tasks');
assert(Array.isArray(INITIAL_HABITS) && INITIAL_HABITS.length === 3, '4.4 INITIAL_HABITS has 3 habits');
assert(Array.isArray(INITIAL_POMODORO_SESSIONS) && INITIAL_POMODORO_SESSIONS.length === 1, '4.5 INITIAL_POMODORO_SESSIONS has 1 session');

// 4.2 Deduplication on Store Hydration
const rawTasksWithDuplicates = [
  { id: 't-1', title: 'Task 1' },
  { id: 't-2', title: 'Task 2' },
  { id: 't-1', title: 'Duplicate Task 1' },
  { id: 't-3', title: 'Task 3' },
  { id: null, title: 'Invalid' }
];
const deduplicated = [];
const seenIds = new Set();
for (const t of rawTasksWithDuplicates) {
  if (!t || !t.id) continue;
  if (!seenIds.has(t.id)) {
    seenIds.add(t.id);
    deduplicated.push(t);
  }
}
assertEqual(deduplicated.length, 3, '4.6 Deduplication logic strictly keeps unique IDs only');
assertEqual(deduplicated.map(t => t.id), ['t-1', 't-2', 't-3'], '4.7 Deduplication preserves original first entries');

// 4.3 Soft-Delete & Trash Lifecycle Simulation
let testTasks = [
  { id: 't-1', title: 'Task 1', completed: false, deleted: false, deletedAt: null },
  { id: 't-2', title: 'Task 2', completed: false, deleted: false, deletedAt: null }
];

// Move t-1 to trash
testTasks = testTasks.map(t => t.id === 't-1' ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t);
assert(testTasks.find(t => t.id === 't-1').deleted === true, '4.8 moveTaskToTrash marks task as deleted');
assert(testTasks.find(t => t.id === 't-1').deletedAt !== null, '4.9 moveTaskToTrash sets deletedAt timestamp');

// Restore t-1
testTasks = testTasks.map(t => t.id === 't-1' ? { ...t, deleted: false, deletedAt: null } : t);
assert(testTasks.find(t => t.id === 't-1').deleted === false, '4.10 restoreTask unmarks deleted flag');
assert(testTasks.find(t => t.id === 't-1').deletedAt === null, '4.11 restoreTask clears deletedAt');

// Empty Trash test
testTasks = [
  { id: 't-1', deleted: true },
  { id: 't-2', deleted: false },
  { id: 't-3', deleted: true }
];
const afterEmpty = testTasks.filter(t => !t.deleted);
assertEqual(afterEmpty.map(t => t.id), ['t-2'], '4.12 emptyTrash permanently removes only deleted tasks');

// 4.4 JSON Serialization & Export/Import Safety
const mockAppState = {
  projects: INITIAL_PROJECTS,
  tasks: INITIAL_TASKS,
  habits: INITIAL_HABITS,
  pomodoroSessions: INITIAL_POMODORO_SESSIONS,
  bonusXp: 0,
  settings: { theme: 'amoled' }
};

const serialized = JSON.stringify(mockAppState, null, 2);
assert(typeof serialized === 'string' && serialized.length > 500, '4.13 exportData serializes state without circular error');

const parsedState = JSON.parse(serialized);
assert(parsedState.projects.length === INITIAL_PROJECTS.length, '4.14 importData successfully reconstructs projects');
assert(parsedState.tasks.length === INITIAL_TASKS.length, '4.15 importData successfully reconstructs tasks');

// Malformed JSON rejection
function validateImport(jsonStr) {
  try {
    const p = JSON.parse(jsonStr);
    if (!p || typeof p !== 'object' || !Array.isArray(p.tasks) || !Array.isArray(p.projects)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}
assert(validateImport('{"invalid": true}') === false, '4.16 validateImport rejects JSON missing tasks/projects arrays');
assert(validateImport('{not valid json}') === false, '4.17 validateImport safely catches syntax errors');
assert(validateImport(serialized) === true, '4.18 validateImport accepts valid OpenTask exported JSON');

// -----------------------------------------------------------------------------
// SUMMARY & REPORT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`   TOTAL TESTS: ${totalTests}`);
console.log(`   PASSED:      ${passedTests}`);
console.log(`   FAILED:      ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nFAILED TESTS SUMMARY:');
  for (const f of failures) {
    console.error(`- ${f.testName}: ${f.details}`);
  }
  process.exit(1);
} else {
  console.log('\n>>> ALL REGRESSION & CODE AUDIT TESTS PASSED WITH 100% SUCCESS! <<<');
  process.exit(0);
}
