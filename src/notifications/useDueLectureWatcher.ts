import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import type { Lecture, PendingAlert } from "../types";
import { parseTimeToMinutes, todayISO } from "../utils/dateUtils";
import { getAttendanceForLectureDate, markAttendance } from "../storage/db";
import { NOTIF_TYPE } from "./scheduler";

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
  const [pendingAlert, setPendingAlert] = useState<PendingAlert | null>(null);
  const firedRef = useRef<Set<string>>(new Set()); // dedupe key: `${lectureId}_${kind}_${dateISO}`

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

  const clearAlert = () => setPendingAlert(null);

  return { pendingAlert, clearAlert };
}
