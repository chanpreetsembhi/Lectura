import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Lecture } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CHANNEL_ID = 'lecture-alarm';

export const NOTIF_TYPE = {
  START: 'lecture_start',
  END: 'lecture_end',
} as const;

// ---------------------------------------------------------------------------
// Notification handler (foreground)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    // false = respect silent mode for notification sound
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Android channel
// ---------------------------------------------------------------------------

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.deleteNotificationChannelAsync(CHANNEL_ID).catch(() => {});

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lecture Alarms',
    importance: Notifications.AndroidImportance.MAX,
    // undefined = use system default sound, respects silent mode
    sound: undefined,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    // false = respect Do Not Disturb mode like a normal app
    bypassDnd: false,
    enableLights: true,
    lightColor: '#4A90D9',
    showBadge: true,
  });
}

// ---------------------------------------------------------------------------
// Attendance quick-reply category (call once at app startup)
// ---------------------------------------------------------------------------

export async function setupAttendanceCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync("ATTENDANCE_PROMPT", [
    {
      identifier: "went",
      buttonTitle: "✅ Went",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "skipped",
      buttonTitle: "❌ Skipped",
      options: { opensAppToForeground: false },
    },
  ]);
}


// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        // false = respect silent mode, not a critical alert
        allowCriticalAlerts: false,
      },
    });
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toExpoWeekday(jsDayOfWeek: number): number {
  return jsDayOfWeek + 1;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduledNotifIds {
  startNotifId: string;
  endNotifId: string;
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export async function scheduleLectureNotifications(
  lecture: Lecture,
): Promise<ScheduledNotifIds> {
  const [startHour, startMinute] = lecture.startTime.split(':').map(Number);
  const [endHour, endMinute] = lecture.endTime.split(':').map(Number);
  const weekday = toExpoWeekday(lecture.dayOfWeek);

  const startNotifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `📚 ${lecture.subject} is Starting!`,
      body: lecture.location
        ? `${lecture.subject} starts now at ${lecture.location}. Tap to open.`
        : `${lecture.subject} starts now. Tap to open.`,
      data: {
        type: NOTIF_TYPE.START,
        lectureId: lecture.id,
      },
      // 'default' = use system sound, respects silent mode
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' && {
        channelId: CHANNEL_ID,
        sticky: false,
        autoDismiss: true,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: startHour,
      minute: startMinute,
      ...(Platform.OS === 'android' && {
        channelId: CHANNEL_ID,
      }),
    },
  });

  const endNotifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `✅ ${lecture.subject} has Ended`,
      body: `Did you attend ${lecture.subject}? Tap to mark attendance.`,
      data: {
        type: NOTIF_TYPE.END,
        lectureId: lecture.id,
      },
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        channelId: CHANNEL_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: endHour,
      minute: endMinute,
      ...(Platform.OS === 'android' && {
        channelId: CHANNEL_ID,
      }),
    },
  });

  return { startNotifId, endNotifId };
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export async function cancelLectureNotifications(
  lecture: Lecture,
): Promise<void> {
  if (lecture.startNotifId) {
    await Notifications
      .cancelScheduledNotificationAsync(lecture.startNotifId)
      .catch(() => {});
  }
  if (lecture.endNotifId) {
    await Notifications
      .cancelScheduledNotificationAsync(lecture.endNotifId)
      .catch(() => {});
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllLectures(
  lectures: Lecture[],
  updateLectureFn: (
    id: string,
    updates: Partial<Lecture>,
  ) => Promise<unknown>,
): Promise<void> {
  for (const lecture of lectures) {
    await cancelLectureNotifications(lecture);
    const { startNotifId, endNotifId } =
      await scheduleLectureNotifications(lecture);
    await updateLectureFn(lecture.id, { startNotifId, endNotifId });
  }
}