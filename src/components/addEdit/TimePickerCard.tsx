import { View, Pressable, Platform, useColorScheme } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import AppText from "../AppText";
import FormCard from "./FormCard";
import { formatTime12h, getDurationLabel, timeStringToDate } from "../../utils/dateUtils";
import { TimePickerCardProps } from "../../types";


export default function TimePickerCard({
  startTime,
  endTime,
  showStartPicker,
  showEndPicker,
  onStartPress,
  onEndPress,
  onStartChange,
  onEndChange,
  onStartCancel,
  onEndCancel,
}: TimePickerCardProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <>
      <FormCard label="Time">
        <View className="flex-row items-center px-4 py-3 gap-3">
          <Pressable
            onPress={onStartPress}
            className="flex-1 items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 active:opacity-70"
          >
            <AppText
              size="xs"
              color="secondary"
              weight="500"
              tracking="widest"
              uppercase
              className="mb-1"
            >
              Start
            </AppText>
            <AppText size="lg" weight="500" bold className="pb-0">
              {formatTime12h(startTime)}
            </AppText>
          </Pressable>

          <Feather
            name="arrow-right"
            size={16}
            color={isDark ? "#4b5563" : "#9ca3af"}
          />

          <Pressable
            onPress={onEndPress}
            className="flex-1 items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 active:opacity-70"
          >
            <AppText
              size="xs"
              color="secondary"
              weight="500"
              tracking="widest"
              uppercase
              className="mb-1"
            >
              End
            </AppText>
            <AppText size="lg" weight="500" bold className="pb-0">
              {formatTime12h(endTime)}
            </AppText>
          </Pressable>
        </View>

        {startTime < endTime && (
          <View className="flex-row items-center justify-center gap-1.5 pb-3">
            <Feather
              name="clock"
              size={11}
              color={isDark ? "#4b5563" : "#9ca3af"}
            />
            <AppText size="xs" color="secondary" className="pb-0">
              {getDurationLabel(startTime, endTime)}
            </AppText>
          </View>
        )}
      </FormCard>

      {showStartPicker && (
        <DateTimePicker
          value={timeStringToDate(startTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={onStartChange}
          onTouchCancel={onStartCancel}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={timeStringToDate(endTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={onEndChange}
          onTouchCancel={onEndCancel}
        />
      )}
    </>
  );
}
