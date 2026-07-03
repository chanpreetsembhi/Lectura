import { ScrollView, Pressable, View } from "react-native";
import AppText from "./AppText";
import { cn } from "../utils/cn";
import { DAY_SHORT, DayInfoProps } from "../types";
import { useEffect, useRef } from "react";

export default function DayRail({
  weekDates,
  selectedDay,
  todayDow,
  onSelectDay,
}: DayInfoProps) {
  const scrollRef = useRef<ScrollView>(null);
  const itemWidthRef = useRef<number>(0);

  useEffect(() => {
    if (itemWidthRef.current === 0) return;
    // Scroll so today's pill is visible, with a small left offset
    const x = Math.max(
      0,
      selectedDay * itemWidthRef.current - itemWidthRef.current,
    );
    scrollRef.current?.scrollTo({ x, animated: false });
  }, []); // run once on mount only

  return (
    <View className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 px-5 py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {weekDates.map(({ dow, date }) => {
          const isSelected = dow === selectedDay;
          const isSunday = dow === 0;
          const isToday = dow === todayDow;

          const labelColorClass = isSelected
            ? "text-white"
            : isToday
              ? "text-sky-700 dark:text-sky-400"
              : isSunday
                ? "text-red-500"
                : "text-gray-400 dark:text-gray-400";

          const dateColorClass = isSelected
            ? "text-white"
            : isToday
              ? "text-sky-700 dark:text-sky-400"
              : isSunday
                ? "text-red-500"
                : "text-gray-800 dark:text-gray-200";

          return (
            <Pressable
              key={dow}
              onPress={() => onSelectDay(dow)}
              onLayout={(e) => {
                if (dow === 0) {
                  itemWidthRef.current = e.nativeEvent.layout.width;
                }
              }}
              className={cn(
                "relative items-center rounded-xl px-3 py-1.5",
                isSelected ? "bg-sky-700" : "bg-transparent",
              )}
            >
              {isToday && (
                <View
                  className={cn(
                    "absolute top-1.5 right-1.5 size-1 rounded-full",
                    isSelected ? "bg-white" : "bg-sky-700 dark:bg-sky-400",
                  )}
                />
              )}
              <AppText
                size="xs"
                weight="500"
                className={cn("pb-1.5", labelColorClass)}
              >
                {DAY_SHORT[dow]}
              </AppText>
              <AppText weight="600" className={cn("pb-0", dateColorClass)}>
                {date}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
