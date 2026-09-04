import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { dateLocale } from "../lib/i18n";

export function ymdFromDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dateFromYmd(ymd: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (ymd: string) => void;
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const parsed = dateFromYmd(value);
  const label = parsed.toLocaleDateString(dateLocale(i18n.language), {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function onPick(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed") return;
    if (selected) onChange(ymdFromDate(selected));
  }

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3"
      >
        <Text className="text-base text-[#F5F5F0]">{label}</Text>
        <Calendar color="#4A7C5D" size={20} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === "android" ? "calendar" : "inline"}
          onChange={onPick}
          themeVariant="dark"
        />
      ) : null}
    </View>
  );
}
