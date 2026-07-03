// components/stats/SubjectList.tsx
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../AppText";
import SubjectCard from "./SubjectCard";
import type { GroupedSubject } from "../../utils/groupBySubject";

type Props = { subjects: GroupedSubject[] };

export default function SubjectList({ subjects }: Props) {
  return (
    <View className="mt-5 px-5">
      <View className="flex-row items-center justify-between mb-3">
        <AppText size="lg" weight="500" bold>By subject</AppText>
        <View className="h-8 min-w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5">
          <AppText size="sm" color="secondary" weight="500">{subjects.length}</AppText>
        </View>
      </View>

      {subjects.length === 0 ? (
        <View className="items-center rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-10">
          <View className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full size-16 mb-4">
            <Feather name="book-open" size={26} color="#6a7282" />
          </View>
          <AppText weight="600" center className="mb-1">No subjects yet</AppText>
          <AppText size="sm" color="secondary" center>
            Add lectures to see your attendance breakdown here.
          </AppText>
        </View>
      ) : (
        subjects.map((s) => <SubjectCard key={s.key} subject={s} />)
      )}
    </View>
  );
}