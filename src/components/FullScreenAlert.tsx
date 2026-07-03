import {
  View,
  Text,
  Modal,
  Pressable,
  Vibration,
  useColorScheme,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { FullScreenAlertProps } from "../types";
import { formatTime12h } from "../utils/dateUtils";
import { useEffect, useRef } from "react";
import AppText from "../components/AppText";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIBRATE_PATTERN = [0, 600, 300, 600, 300, 600];
const ALERT_TIMEOUT_MS = 30000;
const KEEP_AWAKE_TAG = "FullScreenAlert";
const ALERT_SOUND = require("../../assets/alert.mp3");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FullScreenAlert({
  visible,
  lecture,
  kind,
  onWent,
  onSkipped,
  onDismiss,
}: FullScreenAlertProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  // ── Stop everything ──────────────────────────────────────────────────────
  const stopAll = () => {
    Vibration.cancel();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }

    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  };

  // ── Start / stop when visibility changes ─────────────────────────────────
  useEffect(() => {
    if (!visible) {
      stopAll();
      return;
    }

    // Keep screen on
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});

    // Vibrate regardless of silent mode
    Vibration.vibrate(VIBRATE_PATTERN, true);

    // Sound — respects silent mode (playsInSilentMode: false)
    (async () => {
      try {
        await setAudioModeAsync({
          // false = respect the physical silent/mute switch
          // true  = play even when silent (like alarm apps)
          // We use false so it behaves like a normal app
          playsInSilentMode: false,
        });

        const player = createAudioPlayer(ALERT_SOUND);
        player.loop = true;
        player.volume = 1.0;

        // Small delay on Android to ensure audio mode applied
        if (Platform.OS === "android") {
          await new Promise((r) => setTimeout(r, 150));
        }

        player.play();
        playerRef.current = player;
      } catch (err) {
        console.warn("FullScreenAlert: sound error", err);
      }
    })();

    // Auto-stop after 30s
    timeoutRef.current = setTimeout(() => stopAll(), ALERT_TIMEOUT_MS);

    return () => {
      stopAll();
    };
  }, [visible]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleWent = () => {
    stopAll();
    onWent();
  };

  const handleSkipped = () => {
    stopAll();
    onSkipped();
  };

  const handleDismiss = () => {
    stopAll();
    onDismiss();
  };

  if (!visible || !lecture) return null;

  const isStart = kind === "start";
  const accentColor = lecture.color || "#0369a1";

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#101828" : "#fff" }}
      >
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 px-5 pt-5 pb-3.5">
          <View className="gap-1">
            <AppText
              size="xs"
              weight="500"
              color="secondary"
              tracking="widest"
              uppercase
              className="pb-0"
            >
              {isStart ? "Starting now" : "Just ended"}
            </AppText>
            <AppText size="xl" weight="500" bold>
              Attendance
            </AppText>
          </View>

          {/* Dismiss / close */}
          <Pressable
            onPress={handleDismiss}
            className="items-center justify-center size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 active:opacity-70"
          >
            <Feather
              name="x"
              size={18}
              color={isDark ? "#e5e7eb" : "#374151"}
            />
          </Pressable>
        </View>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View className="bg-gray-50 dark:bg-gray-950 flex-1 px-5 pt-7 gap-7">
          {/* Big time */}
          <View className="items-center">
            <AppText
              style={{ fontSize: 72, lineHeight: 72, letterSpacing: -2 }}
              weight="500"
              className="pb-0"
            >
              {formatTime12h(lecture.startTime)
                .replace(":00", "")
                .toUpperCase()}
            </AppText>
          </View>

          {/* Subject card */}
          <View className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <View style={{ backgroundColor: accentColor, height: 4 }} />
            <View className="p-4">
              <AppText
                size="xs"
                weight="500"
                color="secondary"
                tracking="widest"
                uppercase
                className="mb-1"
              >
                Subject
              </AppText>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "500",
                  color: accentColor,
                  lineHeight: 30,
                  marginBottom: 14,
                }}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {lecture.subject}
              </Text>
              <View className="flex-row gap-2.5">
                <View className="flex-row items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                  <Feather
                    name="clock"
                    size={13}
                    color={isDark ? "#6b7280" : "#9ca3af"}
                  />
                  <AppText size="sm" weight="500" className="pb-0">
                    {formatTime12h(lecture.startTime)} –{" "}
                    {formatTime12h(lecture.endTime)}
                  </AppText>
                </View>
                {!!lecture.location && (
                  <View className="flex-row items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                    <Feather
                      name="map-pin"
                      size={13}
                      color={isDark ? "#6b7280" : "#9ca3af"}
                    />
                    <AppText
                      size="sm"
                      weight="500"
                      numberOfLines={1}
                      className="pb-0"
                    >
                      {lecture.location}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Prompt */}
          <View className="items-center gap-2.5 pt-18">
            <View className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full size-16">
              <Feather
                name={isStart ? "bell" : "check-circle"}
                size={28}
                color={accentColor}
              />
            </View>
            <AppText size="lg" weight="500" bold center className="mb-0.5">
              {isStart ? "Class is starting!" : "Class has ended"}
            </AppText>
            <AppText size="sm" color="secondary" center tracking="wide">
              {isStart
                ? "Mark your attendance when class ends."
                : "Did you attend this lecture?"}
            </AppText>
          </View>
        </View>

        {/* ── Bottom action bar ──────────────────────────────────────────── */}
        <View className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 pt-4 pb-5">
          {isStart ? (
            <Pressable
              onPress={handleDismiss}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-85"
              style={{ backgroundColor: accentColor }}
            >
              <Feather name="check" size={16} color="#fff" />
              <AppText className="text-white pb-0" weight="500" bold>
                Got it
              </AppText>
            </Pressable>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleWent}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-85"
                style={{ backgroundColor: accentColor }}
              >
                <Feather name="check" size={16} color="#fff" />
                <AppText className="text-white pb-0" weight="500" bold>
                  Went
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleSkipped}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 active:opacity-70"
              >
                <Feather
                  name="x"
                  size={16}
                  color={isDark ? "#fca5a5" : "#991b1b"}
                />
                <AppText
                  className="text-red-800 dark:text-red-400 pb-0"
                  weight="500"
                  bold
                >
                  Skipped
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
