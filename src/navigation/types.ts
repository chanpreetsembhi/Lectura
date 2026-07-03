import { DayOfWeek } from "../types";

export type RootStackParamList = {
  Timetable: undefined;
  AddEditLecture: { lectureId?: string; dayOfWeek?: DayOfWeek } | undefined;
  Stats: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamsList extends RootStackParamList {}
  }
}
