import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "./AppText";
import { DAY_NAMES, EmptyDayProps } from "../types";

export default function EmptyDayState(props: EmptyDayProps) {
  if (props.variant === "sunday") {
    return (
      <View className="flex-2 items-center justify-center">
        <View className="items-center justify-center bg-red-100 rounded-full size-18 mb-4">
          <Feather name="sun" size={30} color="#A32D2D" />
        </View>
        <AppText size="lg" weight="600" center>Sunday is off</AppText>
        <AppText size="sm" color="secondary" tracking="wider" center>
          No lectures scheduled. Enjoy the break.
        </AppText>
      </View>
    );
  }

  return (
    <View className="items-center justify-center pt-28">
      <View className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full size-16 mb-4">
        <Feather name="inbox" size={26} color="#6a7282" />
      </View>
      <AppText weight="600" center>No lectures yet</AppText>
      <AppText size="sm" color="secondary" tracking="wider">
        Tap + to add one for {DAY_NAMES[props.dayOfWeek]}
      </AppText>
    </View>
  );
}