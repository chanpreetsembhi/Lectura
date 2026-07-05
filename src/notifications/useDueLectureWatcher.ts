import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import type { Lecture, PendingAlert } from "../types";
import { parseTimeToMinutes, todayISO } from "../utils/dateUtils";
import { getAttendanceForLectureDate, markAttendance } from "../storage/db";
import { NOTIF_TYPE } from "./scheduler";
import AsyncStorage from "@react-native-async-storage/async-storage";

// How late the app can be opened after a lecture's start/end and still
// catch the alert (in minutes). Without this window, missing the exact
// minute means the alert never fires for that lecture that day.
const LATE_WINDOW_MINUTES = 20;

// Persist the pending alert so it survives the app being force-quit after
// the alert appeared but before the user tapped Went/Skipped.
const PENDING_ALERT_KEY = "@lecture_alarm/pending_alert";

async function persistPendingAlert(alert: PendingAlert | null): Promise<void> {
  try {
    if (alert) {
      await AsyncStorage.setItem(PENDING_ALERT_KEY, JSON.stringify(alert));
    } else {
      await AsyncStorage.removeItem(PENDING_ALERT_KEY);
    }
  } catch (e) {
    console.warn("[useDueLectureWatcher] failed to persist pending alert", e);
  }
}

async function loadPersistedAlert(): Promise<PendingAlert | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_ALERT_KEY);
    return raw ? (JSON.parse(raw) as PendingAlert) : null;
  } catch {
    return null;
  }
}

/**
 * Polls every 15s while the app is foregrounded to detect whether "now"
 * exactly matches a lecture's start or end minute, and surfaces a full-screen
 * alert event. Also listens for taps on background notifications so the
 * full-screen alert opens even if the user tapped a notification instead of
 * having the app already open.
 *
 * This is the practical ceiling for "full-screen alarm" inside Expo's
 * managed workflow: true OS-level full-screen-intent (bypassing the lock
 * screen like the stock Clock app) requires native Android code outside
 * what expo-notifications exposes. When the app is open/foregrounded this
 * hook gives a true full-screen takeover; when backgrounded, the OS
 * heads-up notification fires and tapping it opens the full-screen screen.
 */
export function useDueLectureWatcher(lectures: Lecture[]) {
  const [pendingAlert, setPendingAlertState] = useState<PendingAlert | null>(
    null,
  );
  const firedRef = useRef<Set<string>>(new Set()); // dedupe key: `${lectureId}_${kind}_${dateISO}`

  const setPendingAlert = (alert: PendingAlert | null) => {
    setPendingAlertState(alert);
    void persistPendingAlert(alert);
  };

  // On mount: restore any alert that was left unresolved from before the
  // app was killed (e.g. user saw the full-screen alert but swiped the app
  // away instead of tapping Went/Skipped).
  useEffect(() => {
    (async () => {
      const persisted = await loadPersistedAlert();
      if (!persisted) return;

      const today = todayISO();
      // Only restore if it's still relevant today; otherwise discard stale state.
      if (persisted.kind === "end") {
        const existing = await getAttendanceForLectureDate(
          persisted.lecture.id,
          today,
        );
        if (existing) {
          await persistPendingAlert(null);
          return;
        }
      }
      setPendingAlertState(persisted);
    })();
  }, []);

  // Poll while foregrounded
  useEffect(() => {
    const check = async () => {
      if (AppState.currentState !== "active") return;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = todayISO();
      const dow = now.getDay();

      for (const lecture of lectures) {
        if (lecture.dayOfWeek !== dow || dow === 0) continue; // skip Sundays entirely

        const startMin = parseTimeToMinutes(lecture.startTime);
        const endMin = parseTimeToMinutes(lecture.endTime);

        const startKey = `${lecture.id}_start_${today}`;
        const endKey = `${lecture.id}_end_${today}`;

        if (nowMinutes === startMin && !firedRef.current.has(startKey)) {
          firedRef.current.add(startKey);
          setPendingAlert({ lecture, kind: "start" });
          return;
        }

        if (nowMinutes === endMin && !firedRef.current.has(endKey)) {
          const existing = await getAttendanceForLectureDate(lecture.id, today);
          if (!existing) {
            firedRef.current.add(endKey);
            setPendingAlert({ lecture, kind: "end" });
            return;
          }
        }
      }
    };

    const interval = setInterval(check, 15000);
    check();

    return () => clearInterval(interval);
  }, [lectures]);

  // Handle notification taps (cold start or background -> foreground)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data as
          | { type?: string; lectureId?: string }
          | undefined;

        if (!data?.lectureId) return;

        const action = response.actionIdentifier;
        const today = todayISO();

        // ── Case 1: action button tapped ──────────────────────────────────
        if (action === "went" || action === "skipped") {
          const existing = await getAttendanceForLectureDate(
            data.lectureId,
            today,
          );
          if (!existing) {
            await markAttendance(data.lectureId, today, action);
          }
          return;
        }

        // ── Case 2 & 3: notification body tapped → full-screen alert ──────
        const lecture = lectures.find((l) => l.id === data.lectureId);
        if (!lecture) return;

        const kind = data.type === NOTIF_TYPE.START ? "start" : "end";

        // Don't open end alert if already marked
        if (kind === "end") {
          const existing = await getAttendanceForLectureDate(
            data.lectureId,
            today,
          );
          if (existing) return;
        }

        setPendingAlert({ lecture, kind });
      },
    );

    return () => sub.remove();
  }, [lectures]);

  // Handle the case where the app was fully killed and the user tapped the
  // notification (body or action button) to relaunch it. Response listeners
  // above only catch responses that occur after they're attached — a tap
  // that happened while the JS runtime was dead is only recoverable via
  // getLastNotificationResponseAsync(). Without this, cold-start taps were
  // silently dropped: the app would open but no full-screen prompt would
  // appear and no attendance would be recorded.
  useEffect(() => {
    if (lectures.length === 0) return; // wait until lectures are loaded

    (async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (!lastResponse) return;

      const data = lastResponse.notification.request.content.data as
        | { type?: string; lectureId?: string }
        | undefined;
      if (!data?.lectureId) return;

      const action = lastResponse.actionIdentifier;
      const today = todayISO();

      if (action === "went" || action === "skipped") {
        const existing = await getAttendanceForLectureDate(data.lectureId, today);
        if (!existing) {
          await markAttendance(data.lectureId, today, action);
        }
        return;
      }

      const lecture = lectures.find((l) => l.id === data.lectureId);
      if (!lecture) return;

      const kind = data.type === NOTIF_TYPE.START ? "start" : "end";

      if (kind === "end") {
        const existing = await getAttendanceForLectureDate(data.lectureId, today);
        if (existing) return;
      }

      setPendingAlert({ lecture, kind });
    })();
    // Only ever run this once lectures are available; getLastNotificationResponseAsync
    // reflects a one-time historical value so re-running on every lectures change is fine
    // but unnecessary — this still depends on lectures so it can find the matching lecture.
  }, [lectures]);

  const clearAlert = () => setPendingAlert(null);

  return { pendingAlert, clearAlert };
}
