import type { WeekStats } from "../types";

export interface GroupedSubject {
  key: string; subject: string;
  startTime: string; endTime: string;
  days: number[];
  went: number; skipped: number; holiday: number; unmarked: number;
  percentage: number | null;
}

export function groupBySubject(
  perLecture: WeekStats["perLecture"],
  lectures: { id: string; subject: string; startTime: string; endTime: string; dayOfWeek: number }[],
): GroupedSubject[] {
  const map = new Map<string, GroupedSubject>();

  for (const entry of perLecture) {
    const lecture = lectures.find((l) => l.id === entry.lectureId);
    const groupKey = `${entry.subject.toLowerCase()}|${lecture?.startTime ?? ""}|${lecture?.endTime ?? ""}`;

    if (map.has(groupKey)) {
      const existing = map.get(groupKey)!;
      existing.went += entry.went;
      existing.skipped += entry.skipped;
      existing.holiday += entry.holiday;
      existing.unmarked += (entry as any).unmarked ?? 0;
      if (lecture && !existing.days.includes(lecture.dayOfWeek)) {
        existing.days.push(lecture.dayOfWeek);
      }
      const total = existing.went + existing.skipped;
      existing.percentage = total > 0 ? Math.round((existing.went / total) * 100) : null;
    } else {
      map.set(groupKey, {
        key: groupKey,
        subject: entry.subject,
        startTime: lecture?.startTime ?? "",
        endTime: lecture?.endTime ?? "",
        days: lecture ? [lecture.dayOfWeek] : [],
        went: entry.went,
        skipped: entry.skipped,
        holiday: entry.holiday,
        unmarked: (entry as any).unmarked ?? 0,
        percentage: entry.percentage,
      });
    }
  }

  for (const group of map.values()) {
    group.days.sort((a, b) => a - b);
  }

  return [...map.values()]; // ← was missing
}