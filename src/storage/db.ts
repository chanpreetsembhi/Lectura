import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, AttendanceRecord, BadgeStatus, Lecture } from '../types';

const KEYS = {
  LECTURES: '@lecture_alarm/lectures',
  ATTENDANCE: '@lecture_alarm/attendance',
  SETTINGS: '@lecture_alarm/settings',
  PENDING_ALERT: '@lecture_alarm/pending_alert',
};

// ---------- Lectures ----------

export async function getLectures(): Promise<Lecture[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LECTURES);
    return raw ? (JSON.parse(raw) as Lecture[]) : [];
  } catch (e) {
    console.error('getLectures failed', e);
    return [];
  }
}

export async function saveLectures(lectures: Lecture[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.LECTURES, JSON.stringify(lectures));
    return true;
  } catch (e) {
    console.error('saveLectures failed', e);
    return false;
  }
}

export async function addLecture(lecture: Lecture): Promise<Lecture[]> {
  const lectures = await getLectures();
  lectures.push(lecture);
  await saveLectures(lectures);
  return lectures;
}

export async function updateLecture(id: string, updates: Partial<Lecture>): Promise<Lecture[]> {
  const lectures = await getLectures();
  const idx = lectures.findIndex((l) => l.id === id);
  if (idx !== -1) {
    lectures[idx] = { ...lectures[idx], ...updates };
    await saveLectures(lectures);
  }
  return lectures;
}

export async function deleteLecture(id: string): Promise<Lecture[]> {
  const lectures = await getLectures();
  const filtered = lectures.filter((l) => l.id !== id);
  await saveLectures(filtered);
  // also clean up attendance records tied to this lecture
  const attendance = await getAttendance();
  const filteredAttendance = attendance.filter((a) => a.lectureId !== id);
  await saveAttendance(filteredAttendance);
  return filtered;
}

// ---------- Attendance ----------

export async function getAttendance(): Promise<AttendanceRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ATTENDANCE);
    return raw ? (JSON.parse(raw) as AttendanceRecord[]) : [];
  } catch (e) {
    console.error('getAttendance failed', e);
    return [];
  }
}

export async function saveAttendance(records: AttendanceRecord[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
    return true;
  } catch (e) {
    console.error('saveAttendance failed', e);
    return false;
  }
}

/**
 * Mark attendance for a lecture on a specific date. Overwrites any existing
 * record for the same lecture+date (so re-marking just updates it).
 */
export async function markAttendance(
  lectureId: string,
  date: string,
  status: BadgeStatus
): Promise<AttendanceRecord[]> {
  const records = await getAttendance();
  const idx = records.findIndex((r) => r.lectureId === lectureId && r.date === date);
  const record: AttendanceRecord = {
    id: idx !== -1 ? records[idx].id : `${lectureId}_${date}`,
    lectureId,
    date,
    status,
    markedAt: Date.now(),
  };
  if (idx !== -1) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await saveAttendance(records);
  return records;
}

/**
 * Mark every lecture scheduled on `date` as holiday in one go.
 */
export async function markDateAsHoliday(date: string, lecturesForThatDay: Lecture[]): Promise<AttendanceRecord[]> {
  const records = await getAttendance();
  lecturesForThatDay.forEach((lecture) => {
    const idx = records.findIndex((r) => r.lectureId === lecture.id && r.date === date);
    const record: AttendanceRecord = {
      id: idx !== -1 ? records[idx].id : `${lecture.id}_${date}`,
      lectureId: lecture.id,
      date,
      status: 'holiday',
      markedAt: Date.now(),
    };
    if (idx !== -1) records[idx] = record;
    else records.push(record);
  });
  await saveAttendance(records);
  return records;
}

/**
 * Mark every lecture scheduled on `date` as leave in one go
 * (e.g. student is on approved leave / bunking college for the day).
 */
export async function markDateAsLeave(date:string, lectureForThatDay: Lecture[]): Promise<AttendanceRecord[]>{
  const records = await getAttendance();
  lectureForThatDay.forEach((lecture) => {
    const idx = records.findIndex((r) => r.lectureId === lecture.id && r.date === date);
    const record: AttendanceRecord = {
      id: idx !== -1 ? records[idx].id : `${lecture.id}_${date}`,
      lectureId: lecture.id,
      date,
      status: 'leave',
      markedAt: Date.now(),
    };
    if (idx !== -1) records[idx] = record;
    else records.push(record);
  });
  await saveAttendance(records);
  return records;
}

export async function getAttendanceForLectureDate(
  lectureId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const records = await getAttendance();
  return records.find((r) => r.lectureId === lectureId && r.date === date) || null;
}

// ---------- Settings ----------

const DEFAULT_SETTINGS: AppSettings = {
  alarmStyle: 'fullscreen',
  weekStartsOn: 1,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}
