import "./global.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { AppState, useColorScheme, type AppStateStatus } from "react-native";
import {
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import RootNavigator from "./src/navigation/RootNavigator";
import FullScreenAlert from "./src/components/FullScreenAlert";
import { getLectures, markAttendance } from "./src/storage/db";
import {
  setupNotificationChannel,
  setupAttendanceCategory,
  requestNotificationPermissions,
  NOTIF_TYPE,
} from "./src/notifications/scheduler";
import { useDueLectureWatcher } from "./src/notifications/useDueLectureWatcher";
import { todayISO } from "./src/utils/dateUtils";
import type { Lecture } from "./src/types";

// Keep splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [ready, setReady] = useState(false);

  const colorScheme = useColorScheme();

  const navigationRef =
    useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ---------------------------------------------------------------------------
  // Load lectures
  // ---------------------------------------------------------------------------

  const loadLectures = useCallback(async () => {
    const l = await getLectures();
    setLectures(l);
  }, []);

  // ---------------------------------------------------------------------------
  // Setup on mount — load fonts first, then everything else
  // ---------------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          "Inter-400": require("./assets/fonts/Inter-Regular.ttf"),
          "Inter-500": require("./assets/fonts/Inter-Medium.ttf"),
          "Inter-600": require("./assets/fonts/Inter-SemiBold.ttf"),
          "Inter-700": require("./assets/fonts/Inter-Bold.ttf"),
        });

        await setupNotificationChannel();
        await setupAttendanceCategory();
        await requestNotificationPermissions();
        await loadLectures();
      } catch (e) {
        console.warn("[App] Setup error:", e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, [loadLectures]);

  // ---------------------------------------------------------------------------
  // Notification listeners (data refresh only — the actual full-screen-alert
  // and cold-start-response handling lives inside useDueLectureWatcher, so
  // there's exactly one place responsible for opening/resolving the alert)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const tapSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const lectureId = data?.lectureId as string | undefined;
        const type = data?.type as string | undefined;

        if (!lectureId) return;

        setTimeout(() => {
          if (type === NOTIF_TYPE.START || type === NOTIF_TYPE.END) {
            loadLectures();
          }
        }, 300);
      });

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        console.log("[Notif] Received in foreground:", data);
        loadLectures();
      });

    return () => {
      tapSubscription.remove();
      foregroundSubscription.remove();
    };
  }, [loadLectures]);

  // ---------------------------------------------------------------------------
  // AppState listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        const previous = appState.current;
        appState.current = nextState;

        if (
          (previous === "background" || previous === "inactive") &&
          nextState === "active"
        ) {
          console.log("[AppState] App came to foreground, reloading lectures");
          await loadLectures();
        }
      },
    );

    return () => subscription.remove();
  }, [loadLectures]);

  // ---------------------------------------------------------------------------
  // FullScreenAlert handlers
  // ---------------------------------------------------------------------------

  const { pendingAlert, clearAlert } = useDueLectureWatcher(lectures);

  const handleWent = async () => {
    if (!pendingAlert) return;
    await markAttendance(pendingAlert.lecture.id, todayISO(), "went");
    clearAlert();
  };

  const handleSkipped = async () => {
    if (!pendingAlert) return;
    await markAttendance(pendingAlert.lecture.id, todayISO(), "skipped");
    clearAlert();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onStateChange={loadLectures}>
        <RootNavigator />
      </NavigationContainer>

      <FullScreenAlert
        visible={!!pendingAlert}
        lecture={pendingAlert?.lecture}
        kind={pendingAlert?.kind}
        onWent={handleWent}
        onSkipped={handleSkipped}
        onDismiss={clearAlert}
      />

      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </SafeAreaProvider>
  );
}
