import { View, Pressable, FlatList, Alert, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { DAY_NAMES } from "../types";
import type { AttendanceRecord, Lecture } from "../types";
import { todayISO } from "../utils/dateUtils";
import { RootStackParamList } from "../navigation/types";
import {
  getAttendance,
  getLectures,
  markDateAsHoliday,
  markDateAsLeave,
} from "../storage/db";
import AppText from "../components/AppText";
import DayRail from "../components/DayRail";
import EmptyDayState from "../components/EmptyDayState";
import LectureCard from "../components/LectureCard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TODAY_DOW = new Date().getDay();
const INITIAL_DAY = TODAY_DOW === 0 ? 1 : TODAY_DOW;

function getWeekDates(): { dow: number; date: number; month: string }[] {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return {
      dow: i,
      date: d.getDate(),
      month: d.toLocaleString("default", { month: "short" }),
    };
  });
}

const WEEK_DATES = getWeekDates();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, "Timetable">;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimetableScreen({ navigation }: Props) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(INITIAL_DAY);

  const colorScheme = useColorScheme();

  const load = useCallback(async () => {
    const [l, a] = await Promise.all([getLectures(), getAttendance()]);
    setLectures(l);
    setAttendance(a);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const dayLectures = lectures
    .filter((l) => l.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getStatusFor = (lectureId: string): AttendanceRecord | null => {
    if (selectedDay !== TODAY_DOW) return null;
    const date = todayISO();
    return (
      attendance.find((r) => r.lectureId === lectureId && r.date === date) ??
      null
    );
  };

  const handleMarkHoliday = () => {
    if (TODAY_DOW === 0) {
      Alert.alert("Already off", "Sunday is already a holiday.");
      return;
    }
    const todaysLectures = lectures.filter((l) => l.dayOfWeek === TODAY_DOW);
    if (todaysLectures.length === 0) {
      Alert.alert("No lectures", "There are no lectures scheduled today.");
      return;
    }
    Alert.alert(
      "Mark today as holiday?",
      `This will mark all ${todaysLectures.length} lecture(s) today as holiday. They won't count against your attendance.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark holiday",
          style: "destructive",
          onPress: async () => {
            await markDateAsHoliday(todayISO(), todaysLectures);
            load();
          },
        },
      ],
    );
  };

  const handleMarkLeave = () => {
    if (TODAY_DOW === 0) {
      Alert.alert("Already off", "Sunday is already a holiday.");
      return;
    }
    const todaysLectures = lectures.filter((l) => l.dayOfWeek === TODAY_DOW);
    if (todaysLectures.length === 0) {
      Alert.alert("No lectures", "There are no lectures scheduled today.");
      return;
    }
    Alert.alert(
      "Mark today as leave?",
      `This will mark all ${todaysLectures.length} lecture(s) today as leave. They won't count against your attendance.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark leave",
          style: "destructive",
          onPress: async () => {
            await markDateAsLeave(todayISO(), todaysLectures);
            load();
          },
        },
      ],
    );
  };

  const selectedWeek = WEEK_DATES[selectedDay];
  const dayDateLabel = `${DAY_NAMES[selectedDay]}, ${selectedWeek.month} ${selectedWeek.date}`;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#101828" : "#fff",
      }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-gray-700 px-5 pt-5 pb-3.5">
        <View>
          <AppText
            size="xs"
            weight="500"
            color="secondary"
            tracking="widest"
            uppercase
          >
            Schedule
          </AppText>
          <AppText size="xl" weight="500" bold className="pb-0">
            Timetable
          </AppText>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Stats")}
          className="flex-row items-center gap-1.5 rounded-full bg-sky-700 px-3.5 py-2 active:opacity-80"
        >
          <Feather name="bar-chart-2" size={14} color="#fff" />
          <AppText size="sm" weight="500" className="text-white pb-0">
            Stats
          </AppText>
        </Pressable>
      </View>

      {/* ── Day rail ──────────────────────────────────────────────────────── */}
      <DayRail
        weekDates={WEEK_DATES}
        selectedDay={selectedDay}
        todayDow={TODAY_DOW}
        onSelectDay={setSelectedDay}
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <View className="bg-gray-50 dark:bg-gray-950 flex-1">
        {selectedDay === 0 ? (
          <EmptyDayState variant="sunday" />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={dayLectures}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 16,
            }}
            ListHeaderComponent={
              <View className="flex-row items-center justify-between mb-4.5">
                <AppText weight="500" color="primary">
                  {dayDateLabel}
                </AppText>
                {dayLectures.length > 0 && (
                  <AppText
                    size="xs"
                    className="bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-800/50 dark:text-sky-400 dark:border-sky-600 rounded-full overflow-hidden py-1 px-2.5"
                  >
                    {dayLectures.length} class
                    {dayLectures.length !== 1 ? "es" : ""}
                  </AppText>
                )}
              </View>
            }
            ListEmptyComponent={
              <EmptyDayState variant="empty" dayOfWeek={selectedDay} />
            }
            renderItem={({ item, index }) => (
              <LectureCard
                item={item}
                isLast={index === dayLectures.length - 1}
                attendance={getStatusFor(item.id)}
                onPress={(id) =>
                  navigation.navigate("AddEditLecture", { lectureId: id })
                }
              />
            )}
          />
        )}
      </View>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 px-5 pt-4 pb-5">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleMarkHoliday}
            className="flex-row items-center gap-2 bg-purple-100 border border-purple-200 dark:bg-purple-800/25 dark:border-purple-800 rounded-full px-5 py-3 active:opacity-70"
          >
            <Feather name="sun" size={16} color="#9810fa" />
            <AppText
              size="sm"
              weight="500"
              className="text-purple-800 dark:text-purple-400 pb-0"
            >
              Holiday
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleMarkLeave}
            className="flex-row items-center gap-2 bg-amber-100 border border-amber-200 dark:bg-amber-800/25 dark:border-amber-800 rounded-full px-4 py-3 active:opacity-70"
          >
            <Feather name="log-out" size={16} color="#d08700" />
            <AppText
              size="sm"
              weight="500"
              className="text-amber-800 dark:text-amber-400 pb-0"
            >
              Leave
            </AppText>
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            navigation.navigate("AddEditLecture", {
              dayOfWeek: selectedDay as Lecture["dayOfWeek"],
            })
          }
          className="items-center justify-center size-12 bg-sky-700 rounded-full active:opacity-85"
        >
          <Feather name="plus" size={24} color="#ffffff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
