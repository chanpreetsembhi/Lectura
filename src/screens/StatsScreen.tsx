import { useCallback, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLectures, getAttendance } from "../storage/db";
import { RootStackParamList } from "../navigation/types";
import { computeWeekStats } from "../utils/attendanceStats";
import type { WeekStats } from "../types";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import WeekNavigator from "../components/stats/WeekNavigator";
import AttendanceOverviewCard from "../components/stats/AttendanceOverviewCard";
import SubjectList from "../components/stats/SubjectList";
import { groupBySubject } from "../utils/groupBySubject";

type Props = NativeStackScreenProps<RootStackParamList, "Stats">;

export default function StatsScreen({ navigation }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [weekOffset, setWeekOffset] = useState(0);
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [allLectures, setAllLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lectures, attendance] = await Promise.all([
        getLectures(),
        getAttendance(),
      ]);
      setAllLectures(lectures);
      const ref = new Date();
      ref.setDate(ref.getDate() + weekOffset * 7);
      const result = computeWeekStats(lectures, attendance, 1, ref);
      setStats(result);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Group subjects by name + time
  const groupedSubjects = useMemo(() => {
    if (!stats) return [];
    return groupBySubject(stats.perLecture, allLectures);
  }, [stats, allLectures]);

  if (loading && !stats) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#030712" : "#f9fafb" }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDark ? "#38BDF8" : "#0369a1"}
          />
          <AppText size="sm" color="secondary" weight="600" className="mt-3">
            Loading stats…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) return null;

  const isCurrentWeek = weekOffset === 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#101828" : "#ffffff" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 pt-5 pb-3.5">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="items-center justify-center size-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 active:opacity-70"
          >
            <Feather
              name="arrow-left"
              size={20}
              color={isDark ? "#e5e7eb" : "#374151"}
            />
          </Pressable>

          <View>
            <AppText
              size="xs"
              weight="500"
              color="secondary"
              tracking="widest"
              uppercase
              className="pb-0"
            >
              Analytics
            </AppText>
            <AppText size="xl" weight="500" bold className="pb-0">
              Lectures Stats
            </AppText>
          </View>
        </View>
      </View>

      {/* ── Week navigation ───────────────────────────────────────────── */}
      <WeekNavigator
        weekStart={stats.weekStart}
        weekEnd={stats.weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => setWeekOffset((w) => w - 1)}
        onNext={() => setWeekOffset((w) => w + 1)}
      />

      <ScrollView className="bg-gray-50 dark:bg-gray-950"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Overview card ─────────────────────────────────────────────── */}
        <AttendanceOverviewCard
          overallPercentage={stats.overallPercentage}
          totals={stats.totals}
          isCurrentWeek={isCurrentWeek}
        />

        {/* ── By subject (grouped) ──────────────────────────────────────── */}
        <SubjectList subjects={groupedSubjects} />
      </ScrollView>
    </SafeAreaView>
  );
}
