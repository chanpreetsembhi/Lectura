import type { AttendanceRecord, AllStats, Lecture, LectureStats, WeekStats } from '../types';
import { STATUS } from '../types';
import { formatDateISO, getWeekDates, isSunday } from './dateUtils';

/**
 * Get all (lecture, date) occurrences that should have happened between
 * a lecture's recurring weekly slot and a date range, excluding Sundays.
 */
function getOccurrencesInRange(lecture: Lecture, startDate: Date, endDate: Date): string[] {
  const occurrences: string[] = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    if (cur.getDay() === lecture.dayOfWeek && !isSunday(cur)) {
      occurrences.push(formatDateISO(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return occurrences;
}

/**
 * Compute attendance stats for a single subject/lecture over a date range.
 * Only counts occurrences up to and including today (future scheduled
 * classes that haven't happened yet are not counted as skipped).
 */
export function computeLectureStats(
  lecture: Lecture,
  attendanceRecords: AttendanceRecord[],
  startDate: Date,
  endDate: Date
): LectureStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveEnd = endDate > today ? today : endDate;

  const occurrences = getOccurrencesInRange(lecture, startDate, effectiveEnd);
  const recordsByDate: Record<string, AttendanceRecord> = {};
  attendanceRecords
    .filter((r) => r.lectureId === lecture.id)
    .forEach((r) => {
      recordsByDate[r.date] = r;
    });

  let went = 0;
  let skipped = 0;
  let holiday = 0;
  let unmarked = 0;

  occurrences.forEach((date) => {
    const record = recordsByDate[date];
    if (!record) {
      unmarked += 1;
      return;
    }
    if (record.status === STATUS.WENT) went += 1;
    else if (record.status === STATUS.SKIPPED) skipped += 1;
    else if (record.status === STATUS.HOLIDAY) holiday += 1;
  });

  const countedTotal = went + skipped; // holidays & unmarked excluded from %
  const percentage = countedTotal === 0 ? null : Math.round((went / countedTotal) * 100);

  return {
    lectureId: lecture.id,
    subject: lecture.subject,
    totalOccurrences: occurrences.length,
    went,
    skipped,
    holiday,
    unmarked,
    percentage,
  };
}

/**
 * Compute stats for every lecture across a date range, plus an overall
 * combined percentage.
 */
export function computeAllStats(
  lectures: Lecture[],
  attendanceRecords: AttendanceRecord[],
  startDate: Date,
  endDate: Date
): AllStats {
  const perLecture = lectures.map((lecture) =>
    computeLectureStats(lecture, attendanceRecords, startDate, endDate)
  );

  const totals = perLecture.reduce(
    (acc, s) => {
      acc.went += s.went;
      acc.skipped += s.skipped;
      acc.holiday += s.holiday;
      acc.unmarked += s.unmarked;
      return acc;
    },
    { went: 0, skipped: 0, holiday: 0, unmarked: 0 }
  );

  const countedTotal = totals.went + totals.skipped;
  const overallPercentage = countedTotal === 0 ? null : Math.round((totals.went / countedTotal) * 100);

  return { perLecture, totals, overallPercentage };
}

/** Convenience: stats for the current Mon-Sun week. */
export function computeWeekStats(
  lectures: Lecture[],
  attendanceRecords: AttendanceRecord[],
  weekStartsOn = 1,
  referenceDate: Date = new Date()
): WeekStats {
  const week = getWeekDates(referenceDate, weekStartsOn);
  const start = week[0];
  const end = week[6];
  return {
    ...computeAllStats(lectures, attendanceRecords, start, end),
    weekStart: start,
    weekEnd: end,
  };
}