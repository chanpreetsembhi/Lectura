import { View, Pressable } from "react-native";
import AppText from "../AppText";
import FormCard from "./FormCard";
import { DAY_NAMES } from "../../types";
import type { DayOfWeek, DayPickerCardProps } from "../../types";
import { cn } from "../../utils/cn";

export default function DayPickerCard({ selectedDays, onToggle, disabled }: DayPickerCardProps) {
  return (
    <FormCard label="Day">
      <View className="flex-row flex-wrap items-center justify-between gap-2 p-4">
        {DAY_NAMES.map((name, idx) => {
          if (idx === 0) return null;
          const selected = selectedDays.has(idx as DayOfWeek);
          return (
            <Pressable
              key={name}
              onPress={() => !disabled && onToggle(idx as DayOfWeek)}
              className={cn(
                "rounded-xl border px-3 py-2 active:opacity-70",
                selected
                  ? "border-sky-600 bg-sky-700"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
                disabled && "opacity-60",
              )}
            >
              <AppText
                size="sm"
                weight="500"
                className={cn("pb-0", selected ? "text-white" : "text-gray-600 dark:text-gray-400")}
              >
                {name.slice(0, 3)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </FormCard>
  );
}