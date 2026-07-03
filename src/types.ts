// Day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday (matches JS Date.getDay())
import { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";

// Screen Top Bar props
export type TopBarProps = {
  eyebrow: string;
  title: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
};

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Day Rail
export type DayInfo = { dow: number; date: number; month: string };

export type DayInfoProps = {
  weekDates: DayInfo[];
  selectedDay: number;
  todayDow: number;
  onSelectDay: (dow: number) => void;
};

// Empty day State
export type EmptyDayProps =
  | { variant: "sunday" }
  | { variant: "empty"; dayOfWeek: number };

// Lecture Card
export type BadgeStatus = "went" | "skipped" | "holiday" | "leave";

export type LectureCardProps = {
  item: Lecture;
  isLast: boolean;
  attendance: AttendanceRecord | null;
  onPress: (lectureId: string) => void;
};

// Full Screen Alert
export interface FullScreenAlertProps {
  visible: boolean;
  lecture: Lecture | null | undefined;
  kind: "start" | "end" | undefined;
  onWent: () => void;
  onSkipped: () => void;
  onDismiss: () => void;
}

// Attendance Overview
export type AttendanceCardProps = {
  overallPercentage: number | null;
  totals: WeekStats["totals"];
  isCurrentWeek: boolean;
};

// Percent Ring
export type PercentProps = { percentage: number | null; size?: number };

// Stat Badge
export type SatBadgeProps = { label: string; value: number; dotColor: string };

// Week Navigator
export type WeekProps = {
  weekStart: Date;
  weekEnd: Date;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
};

// Color picker card
export type ColorPickerCardProps = {
  selected: string;
  onSelect: (color: string) => void;
};

// Day Picker Card
export type DayPickerCardProps = {
  selectedDays: Set<DayOfWeek>;
  onToggle: (day: DayOfWeek) => void;
  disabled?: boolean;
};

// Detail Form Card
export type DetailFormCardProps = {
  subject: string;
  location: string;
  onSubjectChange: (v: string) => void;
  onLocationChange: (v: string) => void;
};

// Form Card
export type FormCardProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

// Time picker card
export type TimePickerCardProps = {
  startTime: string;
  endTime: string;
  showStartPicker: boolean;
  showEndPicker: boolean;
  onStartPress: () => void;
  onEndPress: () => void;
  onStartChange: (_event: DateTimePickerChangeEvent, date: Date) => void;
  onEndChange: (_event: DateTimePickerChangeEvent, date: Date) => void;
  onStartCancel: () => void;
  onEndCancel: () => void;
};

export interface Lecture {
  id: string;
  subject: string;
  location: string;
  dayOfWeek: DayOfWeek;
  /** "HH:MM" 24hr */
  startTime: string;
  /** "HH:MM" 24hr */
  endTime: string;
  color: string;
  /** id returned by expo-notifications for the scheduled "start" alert */
  startNotifId?: string;
  /** id returned by expo-notifications for the scheduled "end" alert */
  endNotifId?: string;
}

export interface AttendanceRecord {
  id: string;
  lectureId: string;
  /** "YYYY-MM-DD" */
  date: string;
  status: BadgeStatus;
  markedAt: number;
}

export interface AppSettings {
  alarmStyle: "fullscreen" | "notification";
  weekStartsOn: DayOfWeek;
}

export const STATUS = {
  WENT: "went" as const,
  SKIPPED: "skipped" as const,
  HOLIDAY: "holiday" as const,
  LEAVE: "leave" as const,
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const DAY_MID = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const SUBJECT_COLORS = [
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
] as const;

/** Stats for a single lecture/subject over a date range. */
export interface LectureStats {
  lectureId: string;
  subject: string;
  totalOccurrences: number;
  went: number;
  skipped: number;
  holiday: number;
  unmarked: number;
  /** null means no went/skipped data yet to compute a percentage from */
  percentage: number | null;
}

export interface AllStats {
  perLecture: LectureStats[];
  totals: { went: number; skipped: number; holiday: number; unmarked: number };
  overallPercentage: number | null;
}

export interface WeekStats extends AllStats {
  weekStart: Date;
  weekEnd: Date;
}

/** What's shown in the full-screen alert at a given moment. */
export interface PendingAlert {
  lecture: Lecture;
  kind: "start" | "end";
}
