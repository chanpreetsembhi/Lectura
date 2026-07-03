import { View, Pressable } from "react-native";
import { ColorPickerCardProps, SUBJECT_COLORS } from "../../types";
import FormCard from "./FormCard";

export default function ColorPickerCard({ selected, onSelect }: ColorPickerCardProps) {
  return (
    <FormCard label="Color" className="mb-6">
      <View className="flex-row flex-wrap items-center justify-between gap-3 p-4">
        {SUBJECT_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => onSelect(c)}
            style={{ backgroundColor: c }}
            className="size-8 items-center justify-center rounded-full active:opacity-70"
          >
            {selected === c && <View className="size-4 rounded-full bg-white" />}
          </Pressable>
        ))}
      </View>
    </FormCard>
  );
}