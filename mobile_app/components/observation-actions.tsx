import { Navigation, Share2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { openNavigation, shareObservation } from "../lib/observation-actions";

export function ObservationActions({
  name,
  scientificName,
  latitude,
  longitude,
}: {
  name: string;
  scientificName?: string | null;
  latitude: number;
  longitude: number;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<"navigate" | "share" | null>(null);

  async function navigate() {
    setBusy("navigate");
    try {
      await openNavigation(latitude, longitude);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    try {
      await shareObservation({ name, scientificName, latitude, longitude });
    } catch {
      // User dismissed the sheet or sharing is unavailable.
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="mb-4 flex-row gap-3" style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
      <Pressable
        onPress={navigate}
        disabled={busy != null}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-[#2D5F3F] py-3.5"
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {busy === "navigate" ? (
          <ActivityIndicator color="#F5F5F0" />
        ) : (
          <>
            <Navigation color="#F5F5F0" size={18} />
            <Text className="font-semibold text-[#F5F5F0]">{t("observations.navigate")}</Text>
          </>
        )}
      </Pressable>
      <Pressable
        onPress={share}
        disabled={busy != null}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-[#2D5F3F] bg-[#1B3022] py-3.5"
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {busy === "share" ? (
          <ActivityIndicator color="#F5F5F0" />
        ) : (
          <>
            <Share2 color="#F5F5F0" size={18} />
            <Text className="font-semibold text-[#F5F5F0]">{t("observations.share")}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
