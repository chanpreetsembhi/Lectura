// components/stats/SubjectCard.tsx
import { View } from "react-native";
import AppText from "../AppText";
import { DAY_NAMES } from "../../types";
import { percentColor } from "./PercentRing";
import type { GroupedSubject } from "../../utils/groupBySubject"; // move type there

type Props = { subject: GroupedSubject };

export default function SubjectCard({ subject: s }: Props) {
  const color = percentColor(s.percentage);

  return (
    <View className="mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden flex-row items-stretch">
      <View className="w-1" style={{ backgroundColor: color }} />

      <View className="flex-1 p-3">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <AppText weight="500" numberOfLines={1}>{s.subject}</AppText>
            <View className="flex-col gap-1.5 mt-0.5">
              <AppText size="xs" color="secondary" weight="500" className="pb-0">
                {s.went} went · {s.skipped} skipped
                {s.holiday > 0 ? ` · ${s.holiday} holiday` : ""}
              </AppText>
              <View className="flex-row items-center gap-1">
                {s.days.map((d) => (
                  <View key={d} className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">
                    <AppText size="xs" color="secondary" weight="500" className="pb-0" style={{ fontSize: 10 }}>
                      {DAY_NAMES[d]?.slice(0, 3)}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-1.5">
            <AppText size="sm" weight="500" style={{ color }} className="pb-0">
              {s.percentage === null ? "N/A" : `${s.percentage}%`}
            </AppText>
          </View>
        </View>

        <View className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <View
            className="h-full rounded-full"
            style={{
              width: s.percentage === null ? "0%" : `${s.percentage}%`,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    </View>
  );
}