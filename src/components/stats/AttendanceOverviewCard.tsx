import { View } from "react-native";
import AppText from "../AppText";
import PercentRing from "./PercentRing";
import StatBadge from "./StatBadge";
import type { AttendanceCardProps } from "../../types";

export default function AttendanceOverviewCard({ overallPercentage, totals, isCurrentWeek }: AttendanceCardProps) {
  return (
    <View className="mx-5 mt-5 mb-0 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <View className="flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3.5">
        <View>
          <AppText weight="500" bold>Attendance overview</AppText>
          <AppText size="xs" color="secondary" weight="500" className="mt-0.5">
            Marked classes summary
          </AppText>
        </View>

        {isCurrentWeek ? (
          <View className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5">
            <AppText size="xs" weight="500" bold uppercase tracking="wide"
              className="text-emerald-700 dark:text-emerald-400 pb-0">
              ● Live
            </AppText>
          </View>
        ) : (
          <View className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5">
            <AppText size="xs" weight="500" bold uppercase tracking="wide" color="secondary" className="pb-0">
              History
            </AppText>
          </View>
        )}
      </View>

      <View className="flex-row items-center p-4 gap-3">
        <PercentRing percentage={overallPercentage} />
        <View className="flex-1 flex-row flex-wrap -m-1">
          <StatBadge label="Went"    value={totals.went}    dotColor="#10B981" />
          <StatBadge label="Skipped" value={totals.skipped} dotColor="#EF4444" />
          <StatBadge label="Holiday" value={totals.holiday} dotColor="#8B5CF6" />
          {totals.unmarked > 0 && (
            <StatBadge label="Unmarked" value={totals.unmarked} dotColor="#94A3B8" />
          )}
        </View>
      </View>
    </View>
  );
}