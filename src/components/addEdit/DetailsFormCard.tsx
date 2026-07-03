import { View, TextInput, useColorScheme } from "react-native";
import AppText from "../AppText";
import FormCard from "./FormCard";
import { DetailFormCardProps } from "../../types";

export default function DetailsFormCard({ subject, location, onSubjectChange, onLocationChange }: DetailFormCardProps) {
  const isDark = useColorScheme() === "dark";
  const placeholder = isDark ? "#4b5563" : "#9ca3af";

  return (
    <FormCard label="Details">
      {/* Subject */}
      <View className="px-4 pt-3.5 pb-1">
        <AppText size="xs" weight="500" color="secondary" tracking="widest" uppercase className="mb-1.5">
          Subject
        </AppText>
        <TextInput
          className="text-base font-medium text-gray-900 dark:text-gray-50 pb-3 border-b border-gray-100 dark:border-gray-700"
          value={subject}
          onChangeText={onSubjectChange}
          placeholder="e.g. Data Structures"
          placeholderTextColor={placeholder}
          returnKeyType="next"
        />
      </View>

      {/* Location */}
      <View className="px-4 pt-3 pb-4">
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <AppText size="xs" weight="500" color="secondary" tracking="widest" uppercase className="pb-0">
            Location
          </AppText>
          <AppText size="xs" color="secondary" className="pb-0 lowercase opacity-50">
            optional
          </AppText>
        </View>
        <TextInput
          className="text-base font-medium border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-50"
          value={location}
          onChangeText={onLocationChange}
          placeholder="e.g. Room 204"
          placeholderTextColor={placeholder}
          returnKeyType="done"
        />
      </View>
    </FormCard>
  );
}