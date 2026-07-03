import { View, Pressable, useColorScheme } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "./AppText";
import { cn } from "../utils/cn";
import { formatTime12h } from "../utils/dateUtils";
import type { BadgeStatus, LectureCardProps } from "../types";

function getBadge(status: BadgeStatus) {
  const colorScheme = useColorScheme();
  if (status === "went")
    return {
      bgClass: "bg-green-100 dark:bg-green-800/50",
      textClass: "text-green-800 dark:text-green-400",
      iconColor: colorScheme === "dark" ? "#05df72" : "#3B6D11",
      icon: "check",
      label: "Went",
    };
  if (status === "skipped")
    return {
      bgClass: "bg-red-100 dark:bg-red-800/50",
      textClass: "text-red-800 dark:text-red-400",
      iconColor: colorScheme === "dark" ? "#ff6467" : "#A32D2D",
      icon: "x",
      label: "Skipped",
    };
  return {
    bgClass: "bg-amber-100 dark:bg-amber-800/50",
    textClass: "text-amber-800 dark:text-amber-400",
    iconColor: colorScheme === "dark" ? "#ffba00" : "#854F0B",
    icon: "sun",
    label: "Holiday",
  };
}

export default function LectureCard({
  item,
  isLast,
  attendance,
  onPress,
}: LectureCardProps) {
  const badge = attendance ? getBadge(attendance.status as BadgeStatus) : null;

  return (
    <View className="flex-row gap-3">
      {/* Time spine */}
      <View className="items-center shrink-0 w-14">
        <AppText
          size="xs"
          weight="500"
          color="secondary"
          center
          className="mt-6"
        >
          {formatTime12h(item.startTime).replace(":00", "").toLowerCase()}
        </AppText>
        {!isLast && <View className="flex-1 bg-gray-300 w-px mt-3 mb-0" />}
      </View>

      {/* Card */}
      <Pressable
        onPress={() => onPress(item.id)}
        className={cn(
          "flex-1 flex-row bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-600 items-stretch rounded-xl overflow-hidden active:opacity-75",
          isLast ? "mb-0" : "mb-3",
        )}
      >
        <View className="w-1" style={{ backgroundColor: item.color }} />

        <View className="flex-1 p-3">
          <AppText weight="500" className="pb-2">
            {item.subject}
          </AppText>
          <View className="flex-row items-center gap-2.5">
            {!!item.location && (
              <View className="flex-row items-center gap-1">
                <Feather name="map-pin" size={10} color="#6a7282" />
                <AppText size="xs" color="secondary" className="pb-0">
                  {item.location}
                </AppText>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Feather name="clock" size={10} color="#6a7282" />
              <AppText size="xs" color="secondary" className="pb-0">
                {formatTime12h(item.startTime)} – {formatTime12h(item.endTime)}
              </AppText>
            </View>
          </View>
        </View>

        <View className="justify-center pr-3 pl-2">
          {badge ? (
            <View
              className={cn(
                "flex-row items-center rounded-full gap-0.5 px-2.5 py-1",
                badge.bgClass,
              )}
            >
              <Feather
                name={badge.icon as any}
                size={12}
                color={badge.iconColor}
              />
              <AppText size="xs" className={cn("mb-0", badge.textClass)}>
                {badge.label}
              </AppText>
            </View>
          ) : (
            <Feather name="chevron-right" size={16} color="#99a1af" />
          )}
        </View>
      </Pressable>
    </View>
  );
}
