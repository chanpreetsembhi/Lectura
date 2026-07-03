// components/stats/WeekNavigator.tsx
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import AppText from "../AppText";
import { cn } from "../../utils/cn";
import { WeekProps } from "../../types";
import { formatRange } from "../../utils/dateUtils";

export default function WeekNavigator({ weekStart, weekEnd, isCurrentWeek, onPrev, onNext }: WeekProps) {
  const isDark = useColorScheme() === "dark";
  const chevronColor = isDark ? "#38BDF8" : "#0369a1";

  return (
    <View className="flex-row items-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 py-3 gap-3">
      <Pressable
        onPress={onPrev}
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 active:opacity-70"
      >
        <Feather name="chevron-left" size={20} color={chevronColor} />
      </Pressable>

      <View className="flex-1 items-center">
        <AppText weight="500" numberOfLines={1}>{formatRange(weekStart, weekEnd)}</AppText>
        <View className={cn(
          "mt-1.5 rounded-full px-3 py-1",
          isCurrentWeek ? "bg-sky-100 dark:bg-sky-900/40" : "bg-gray-100 dark:bg-gray-800",
        )}>
          <AppText size="xs" weight="500" className={cn(
            "pb-0",
            isCurrentWeek ? "text-sky-700 dark:text-sky-400" : "text-gray-500 dark:text-gray-400",
          )}>
            {isCurrentWeek ? "This week" : "Past week"}
          </AppText>
        </View>
      </View>

      <Pressable
        disabled={isCurrentWeek}
        onPress={onNext}
        className={cn(
          "h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 active:opacity-70",
          isCurrentWeek && "opacity-30",
        )}
      >
        <Feather name="chevron-right" size={20} color={chevronColor} />
      </Pressable>
    </View>
  );
}