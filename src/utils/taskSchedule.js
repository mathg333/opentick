/**
 * Shared OpenTick Task Scheduling Utilities
 * Handles local YYYY-MM-DD dates, multiple dates/times, and recurring date generators.
 */

export function formatDateYMD(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayYMD() {
  return formatDateYMD(new Date());
}

export function addDaysYMD(ymdStr, daysToAdd = 0) {
  const base = parseYMD(ymdStr) || new Date();
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + Number(daysToAdd || 0));
  return formatDateYMD(next);
}

export function parseYMD(ymdStr) {
  if (!ymdStr || typeof ymdStr !== 'string') return null;
  const clean = ymdStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function getTaskDates(task) {
  if (!task) return [];
  if (Array.isArray(task.recurringDates) && task.recurringDates.length > 0) {
    return [...new Set(task.recurringDates.map(d => String(d || '').split('T')[0]).filter(Boolean))].sort();
  }
  if (task.dueDate) {
    return [String(task.dueDate).split('T')[0]];
  }
  return [];
}

export function getTaskTimes(task) {
  if (!task) return [];
  if (Array.isArray(task.recurringTimes) && task.recurringTimes.length > 0) {
    return [...new Set(task.recurringTimes.filter(Boolean))].sort();
  }
  if (task.startTime) {
    return [task.startTime];
  }
  return [];
}

export function isTaskOnDate(task, dateStr) {
  if (!task || !dateStr) return false;
  const dates = getTaskDates(task);
  return dates.includes(dateStr);
}

export function generateDailyDates(startDateStrOrOpts, intervalDays = 1, durationDays = 30) {
  let startDateStr = startDateStrOrOpts;
  if (startDateStrOrOpts && typeof startDateStrOrOpts === 'object' && !Array.isArray(startDateStrOrOpts)) {
    startDateStr = startDateStrOrOpts.startDateStr || getTodayYMD();
    intervalDays = startDateStrOrOpts.intervalDays ?? 1;
    durationDays = startDateStrOrOpts.durationDays ?? 30;
  }
  const base = parseYMD(startDateStr) || parseYMD(getTodayYMD());
  const step = Math.max(1, parseInt(intervalDays, 10) || 1);
  const total = Math.max(1, Math.min(366, parseInt(durationDays, 10) || 30));
  const out = [];
  for (let i = 0; i < total; i += step) {
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push(formatDateYMD(dt));
  }
  return out;
}

export function generateWeeklyDates(startDateStrOrOpts, weekdays = [1, 3, 5], intervalWeeks = 1, durationWeeks = 12) {
  let startDateStr = startDateStrOrOpts;
  if (startDateStrOrOpts && typeof startDateStrOrOpts === 'object' && !Array.isArray(startDateStrOrOpts)) {
    startDateStr = startDateStrOrOpts.startDateStr || getTodayYMD();
    weekdays = startDateStrOrOpts.weekdays || [new Date().getDay()];
    intervalWeeks = startDateStrOrOpts.intervalWeeks ?? 1;
    durationWeeks = startDateStrOrOpts.durationWeeks ?? 12;
  }
  const base = parseYMD(startDateStr) || parseYMD(getTodayYMD());
  const cleanDays = Array.isArray(weekdays) && weekdays.length > 0
    ? [...new Set(weekdays.map(Number).filter(n => !Number.isNaN(n) && n >= 0 && n <= 6))]
    : [base.getDay()];
  const stepW = Math.max(1, parseInt(intervalWeeks, 10) || 1);
  const totalWeeks = Math.max(1, Math.min(104, parseInt(durationWeeks, 10) || 12));

  // Anchor to start of base's week (Sunday) so week index arithmetic stays exact
  const weekStart = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
  const baseStr = formatDateYMD(base);
  const out = new Set();

  for (let w = 0; w < totalWeeks; w += stepW) {
    for (const wd of cleanDays) {
      const dt = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (w * 7) + wd);
      const ymd = formatDateYMD(dt);
      if (ymd >= baseStr) {
        out.add(ymd);
      }
    }
  }

  return [...out].sort();
}

export function generateMonthlyRepeatedDates(dayNumbersOrOpts, baseYear, baseMonth, repeatMonthsCount = 3) {
  let dayNumbers = [];
  let year = baseYear;
  let month = baseMonth;
  let horizon = repeatMonthsCount;

  if (dayNumbersOrOpts && typeof dayNumbersOrOpts === 'object' && !Array.isArray(dayNumbersOrOpts)) {
    const seeds = Array.isArray(dayNumbersOrOpts.seedDates) ? dayNumbersOrOpts.seedDates : [];
    horizon = dayNumbersOrOpts.repeatMonthsCount ?? 3;
    const parsedSeeds = seeds.map(parseYMD).filter(Boolean);
    if (parsedSeeds.length > 0) {
      parsedSeeds.sort((a, b) => a - b);
      year = parsedSeeds[0].getFullYear();
      month = parsedSeeds[0].getMonth();
      dayNumbers = [...new Set(parsedSeeds.map(d => d.getDate()))];
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      dayNumbers = [now.getDate()];
    }
  } else {
    dayNumbers = Array.isArray(dayNumbersOrOpts) ? dayNumbersOrOpts : [Number(dayNumbersOrOpts) || new Date().getDate()];
    const now = new Date();
    if (year === undefined || year === null) year = now.getFullYear();
    if (month === undefined || month === null) month = now.getMonth();
  }

  const totalMonths = Math.max(1, Math.min(24, parseInt(horizon, 10) || 1));
  const cleanDays = [...new Set(dayNumbers.map(Number).filter(n => !Number.isNaN(n) && n >= 1 && n <= 31))];
  if (cleanDays.length === 0) return [];

  const out = new Set();
  for (let offset = 0; offset < totalMonths; offset++) {
    const targetMonthDate = new Date(year, month + offset, 1);
    const ty = targetMonthDate.getFullYear();
    const tm = targetMonthDate.getMonth();
    const daysInTargetMonth = new Date(ty, tm + 1, 0).getDate();

    for (const dNum of cleanDays) {
      const clampedDay = Math.min(dNum, daysInTargetMonth);
      out.add(formatDateYMD(new Date(ty, tm, clampedDay)));
    }
  }

  return [...out].sort();
}

export function generateAnnualDates(yearOrOpts, months = [], daysOfMonth = []) {
  let year = yearOrOpts;
  let targetMonths = months;
  let targetDays = daysOfMonth;

  if (yearOrOpts && typeof yearOrOpts === 'object' && !Array.isArray(yearOrOpts)) {
    year = yearOrOpts.year ?? new Date().getFullYear();
    targetMonths = yearOrOpts.months || [];
    targetDays = yearOrOpts.daysOfMonth || [];
  }

  const y = parseInt(year, 10) || new Date().getFullYear();
  const cleanMonths = Array.isArray(targetMonths) && targetMonths.length > 0
    ? [...new Set(targetMonths.map(Number).filter(m => !Number.isNaN(m) && m >= 0 && m <= 11))]
    : [];
  const cleanDays = Array.isArray(targetDays) && targetDays.length > 0
    ? [...new Set(targetDays.map(Number).filter(d => !Number.isNaN(d) && d >= 1 && d <= 31))]
    : [];

  const out = new Set();
  for (const m of cleanMonths) {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (const d of cleanDays) {
      const clampedDay = Math.min(d, daysInMonth);
      out.add(formatDateYMD(new Date(y, m, clampedDay)));
    }
  }

  return [...out].sort();
}
