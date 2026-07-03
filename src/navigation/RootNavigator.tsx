import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import TimetableScreen from "../screens/TimetableScreen";
import AddEditLectureScreen from "../screens/AddEditLectureScreen";
import StatsScreen from "../screens/StatsScreen";
import { useColorScheme } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const colorScheme = useColorScheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Timetable" component={TimetableScreen} />
      <Stack.Screen name="AddEditLecture" component={AddEditLectureScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
    </Stack.Navigator>
  );
}
