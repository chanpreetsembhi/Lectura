import { View, Pressable, useColorScheme } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../AppText";
import { TopBarProps } from "../../types";

export default function ScreenTopBar({ eyebrow, title, onBack, rightSlot }: TopBarProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="flex-row items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 pt-5 pb-3.5">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onBack}
          className="items-center justify-center size-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 active:opacity-70"
        >
          <Feather name="arrow-left" size={20} color={isDark ? "#e5e7eb" : "#374151"} />
        </Pressable>
        <View>
          <AppText size="xs" weight="500" color="secondary" tracking="widest" uppercase className="pb-0">
            {eyebrow}
          </AppText>
          <AppText size="xl" weight="500" bold className="pb-0">
            {title}
          </AppText>
        </View>
      </View>
      {rightSlot}
    </View>
  );
}