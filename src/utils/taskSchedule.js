// Shared utilities for task dates, multiple times, and recurrence expansion

export function formatDateYMD(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

export function getTodayYMD() {
  return formatDateYMD(new Date());
}

export function parseYMD(dStr) {
  if (!dStr) return new Date();
  const [y, m, d] = dStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Returns sorted unique HH:MM times for a task.
 * Backwards-compatible with single `task.startTime`.
 */
export function getTaskTimes(task) {
  if (!task) return [];
  const set = new Set();
  if (Array.isArray(task.recurringTimes)) {
    for (const t of task.recurringTimes) {
      if (typeof t === 'string' && /^\d{2}:\d{2}$/.test(t.trim())) {
        set.add(t.trim());
      }
    }
  }
  if (typeof task.startTime === 'string' && /^\d{2}:\d{2}$/.test(task.startTime.trim())) {
    set.add(task.startTime.trim());
  }
  return Array.from(set).sort();
}

/**
 * Returns sorted unique YYYY-MM-DD dates for a task.
 * Backwards-compatible with single `task.dueDate`.
 */
export function getTaskDates(task) {
  if (!task) return [];
  const set = new Set();
  if (Array.isArray(task.recurringDates)) {
    for (const d of task.recurringDates) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
        set.add(d.trim());
      }
    }
  }
  if (typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate.trim())) {
    set.add(task.dueDate.trim());
  }
  return Array.from(set).sort();
}

export function isTaskOnDate(task, dateStr) {
  if (!task || !dateStr) return false;
  if (task.dueDate === dateStr) return true;
  if (Array.isArray(task.recurringDates) && task.recurringDates.includes(dateStr)) return true;
  return false;
}

/**
 * Generate daily dates every `intervalDays` for `durationDays` starting at `startDateStr`.
 */
export function generateDailyDates(startDateStr, intervalDays = 1, durationDays = 30) {
  const start = parseYMD(startDateStr || getTodayYMD());
  const step = Math.max(1, Number(intervalDays) || 1);
  const count = Math.max(1, Number(durationDays) || 1);
  const dates = [];
  for (let offset = 0; offset < count; offset += step) {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    dates.push(formatDateYMD(d));
  }
  return dates;
}

/**
 * Generate dates matching selected weekdays [0..6] every `intervalWeeks` for `totalWeeks`.
 */
export function generateWeeklyDates(startDateStr, weekdays = [], intervalWeeks = 1, totalWeeks = 4) {
  if (!weekdays || weekdays.length === 0) return [];
  const start = parseYMD(startDateStr || getTodayYMD());
  start.setHours(0, 0, 0, 0);
  const startSunday = new Date(start);
  startSunday.setDate(start.getDate() - start.getDay());

  const stepWeeks = Math.max(1, Number(intervalWeeks) || 1);
  const weeks = Math.max(1, Number(totalWeeks) || 1);
  const dates = [];

  for (let w = 0; w < weeks; w += stepWeeks) {
    for (let dow = 0; dow < 7; dow++) {
      if (!weekdays.includes(dow)) continue;
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + w * 7 + dow);
      if (d >= start) {
        dates.push(formatDateYMD(d));
      }
    }
  }
  return Array.from(new Set(dates)).sort();
}

/**
 * Repeat specified day-of-month numbers (or days extracted from baseDates)
 * across `monthsCount` consecutive months starting at (startYear, startMonth).
 */
export function generateMonthlyRepeatedDates(dayNumbers = [], startYear, startMonth, monthsCount = 3) {
  if (!dayNumbers || dayNumbers.length === 0) return [];
  const count = Math.max(1, Number(monthsCount) || 1);
  const dates = [];

  for (let offset = 0; offset < count; offset++) {
    const targetMonthDate = new Date(startYear, startMonth + offset, 1);
    const y = targetMonthDate.getFullYear();
    const m = targetMonthDate.getMonth();
    const daysInTargetMonth = new Date(y, m + 1, 0).getDate();

    for (const dayNum of dayNumbers) {
      if (dayNum >= 1 && dayNum <= daysInTargetMonth) {
        dates.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`);
      }
    }
  }
  return Array.from(new Set(dates)).sort();
}

/**
 * Generate dates for selected months [0..11] and selected day-of-month numbers [1..31] in `year`.
 */
export function generateAnnualDates(year, monthsZeroBased = [], dayNumbers = []) {
  if (!monthsZeroBased || monthsZeroBased.length === 0 || !dayNumbers || dayNumbers.length === 0) {
    return [];
  }
  const dates = [];
  for (const m of monthsZeroBased) {
    const daysInM = new Date(year, m + 1, 0).getDate();
    for (const dayNum of dayNumbers) {
      if (dayNum >= 1 && dayNum <= daysInM) {
        dates.push(`${year}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`);
      }
    }
  }
  return Array.from(new Set(dates)).sort();
}
