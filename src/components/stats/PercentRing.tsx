import { View, Text, useColorScheme } from "react-native";
import AppText from "../AppText";
import { PercentProps } from "../../types";

function percentColor(percentage: number | null): string {
  if (percentage === null) return "#94A3B8";
  if (percentage >= 75) return "#10B981";
  if (percentage >= 50) return "#F59E0B";
  return "#EF4444";
}

export default function PercentRing({ percentage, size = 96 }: PercentProps) {
  const isDark = useColorScheme() === "dark";
  const color = percentColor(percentage);
  const innerSize = size - 18;

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 6, borderColor: color,
      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
      alignItems: "center", justifyContent: "center",
    }}>
      <View style={{
        width: innerSize, height: innerSize, borderRadius: innerSize / 2,
        backgroundColor: isDark ? "#111827" : "#ffffff",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color, lineHeight: 24 }}>
          {percentage === null ? "—" : `${percentage}%`}
        </Text>
        <AppText size="xs" color="secondary" tracking="wider" weight="600" className="pb-0" uppercase>
          overall
        </AppText>
      </View>
    </View>
  );
}

export { percentColor };