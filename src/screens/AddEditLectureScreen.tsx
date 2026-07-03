import { useEffect, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { SUBJECT_COLORS } from "../types";
import type { DayOfWeek } from "../types";
import { pad2 } from "../utils/dateUtils";
import { generateId } from "../utils/id";
import {
  addLecture,
  updateLecture,
  deleteLecture,
  getLectures,
} from "../storage/db";
import {
  scheduleLectureNotifications,
  cancelLectureNotifications,
} from "../notifications/scheduler";
import { cn } from "../utils/cn";
import AppText from "../components/AppText";
import ScreenTopBar from "../components/common/ScreenTopBar";
import DetailsFormCard from "../components/addEdit/DetailsFormCard";
import DayPickerCard from "../components/addEdit/DayPickerCard";
import TimePickerCard from "../components/addEdit/TimePickerCard";
import ColorPickerCard from "../components/addEdit/ColorPickerCard";

type Props = NativeStackScreenProps<RootStackParamList, "AddEditLecture">;

function dateToTimeString(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export default function AddEditLectureScreen({ route, navigation }: Props) {
  const { lectureId, dayOfWeek: initialDay } = route.params ?? {};
  const isEditing = !!lectureId;
  const isDark = useColorScheme() === "dark";

  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    new Set(initialDay != null ? [initialDay] : [1]),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    if (isEditing) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        if (next.size === 1) return prev;
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isEditing || !lectureId) return;
    (async () => {
      const lectures = await getLectures();
      const lecture = lectures.find((l) => l.id === lectureId);
      if (lecture) {
        setSubject(lecture.subject);
        setLocation(lecture.location ?? "");
        setSelectedDays(new Set([lecture.dayOfWeek]));
        setStartTime(lecture.startTime);
        setEndTime(lecture.endTime);
        setColor(lecture.color);
      }
      setLoading(false);
    })();
  }, [isEditing, lectureId]);

  const handleSave = async () => {
    if (!subject.trim()) {
      Alert.alert("Subject required", "Please enter a subject name.");
      return;
    }
    if (startTime >= endTime) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    if (selectedDays.size === 0) {
      Alert.alert("No day selected", "Please select at least one day.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && lectureId) {
        const lectures = await getLectures();
        const existing = lectures.find((l) => l.id === lectureId);
        if (existing) await cancelLectureNotifications(existing);
        const dayOfWeek = [...selectedDays][0];
        const updated = {
          subject: subject.trim(),
          location: location.trim(),
          dayOfWeek,
          startTime,
          endTime,
          color,
        };
        const { startNotifId, endNotifId } = await scheduleLectureNotifications(
          {
            ...(existing as NonNullable<typeof existing>),
            ...updated,
            id: lectureId,
          },
        );
        await updateLecture(lectureId, {
          ...updated,
          startNotifId,
          endNotifId,
        });
      } else {
        await Promise.all(
          [...selectedDays].map(async (day) => {
            const newLecture = {
              id: generateId(),
              subject: subject.trim(),
              location: location.trim(),
              dayOfWeek: day,
              startTime,
              endTime,
              color,
            };
            const { startNotifId, endNotifId } =
              await scheduleLectureNotifications(newLecture);
            await addLecture({ ...newLecture, startNotifId, endNotifId });
          }),
        );
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete lecture?",
      `This removes "${subject}" and its attendance history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!lectureId) return;
            const lectures = await getLectures();
            const existing = lectures.find((l) => l.id === lectureId);
            if (existing) await cancelLectureNotifications(existing);
            await deleteLecture(lectureId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#030712" : "#f9fafb" }}
        className="items-center justify-center"
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#38BDF8" : "#0369a1"}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#101828" : "#fff" }}
    >
      <ScreenTopBar
        eyebrow={isEditing ? "Edit" : "New Lecture"}
        title={isEditing ? subject || "Lecture" : "Add Lecture"}
        onBack={() => navigation.goBack()}
        rightSlot={
          isEditing && (
            <Pressable
              onPress={handleDelete}
              className="items-center justify-center size-10 rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 active:opacity-70"
            >
              <Feather
                name="trash-2"
                size={20}
                color={isDark ? "#fca5a5" : "#991b1b"}
              />
            </Pressable>
          )
        }
      />

      <ScrollView
        className="bg-gray-50 dark:bg-gray-950"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: 16,
          paddingTop: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <DetailsFormCard
          subject={subject}
          location={location}
          onSubjectChange={setSubject}
          onLocationChange={setLocation}
        />
        <DayPickerCard
          selectedDays={selectedDays}
          onToggle={toggleDay}
          disabled={isEditing}
        />
        <TimePickerCard
          startTime={startTime}
          endTime={endTime}
          showStartPicker={showStartPicker}
          showEndPicker={showEndPicker}
          onStartPress={() => setShowStartPicker(true)}
          onEndPress={() => setShowEndPicker(true)}
          onStartChange={(_e, date) => {
            setShowStartPicker(false);
            setStartTime(dateToTimeString(date));
          }}
          onEndChange={(_e, date) => {
            setShowEndPicker(false);
            setEndTime(dateToTimeString(date));
          }}
          onStartCancel={() => setShowStartPicker(false)}
          onEndCancel={() => setShowEndPicker(false)}
        />
        <ColorPickerCard selected={color} onSelect={setColor} />
      </ScrollView>

      <View className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 pt-4 pb-5">
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={cn(
            "flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-85",
            saving ? "bg-sky-500/70" : "bg-sky-700",
          )}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Feather
                name={isEditing ? "check" : "plus"}
                size={16}
                color="#fff"
              />
              <AppText className="text-white pb-0" weight="500" bold>
                {isEditing ? "Save changes" : "Add lecture"}
              </AppText>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
