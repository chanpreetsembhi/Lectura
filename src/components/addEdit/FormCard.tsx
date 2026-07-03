import { View } from "react-native";
import AppText from "../AppText";
import { FormCardProps } from "../../types";

export default function FormCard({ label, children, className }: FormCardProps) {
  return (
    <View className={`rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden mb-4 ${className ?? ""}`}>
      <View className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <AppText size="xs" weight="500" color="secondary" tracking="widest" uppercase className="pb-0">
          {label}
        </AppText>
      </View>
      {children}
    </View>
  );
}