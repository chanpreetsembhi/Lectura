import { View } from "react-native";
import AppText from "../AppText";
import { SatBadgeProps } from "../../types";

export default function StatBadge({ label, value, dotColor }: SatBadgeProps) {
  return (
    <View className="w-1/2 p-1">
      <View className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-3">
        <View className="mb-2 h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
        <AppText size="xs" color="secondary" weight="500">{label}</AppText>
        <AppText size="lg" bold className="pb-0">{value}</AppText>
      </View>
    </View>
  );
}