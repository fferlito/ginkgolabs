import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MiniMap } from "../../components/mini-map";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth } from "../../lib/api";
import { currentCoords } from "../../lib/geo";

function param(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function NewLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const incoming = useLocalSearchParams<{
    name?: string;
    notes?: string;
    lat?: string;
    lng?: string;
  }>();
  const presetLat = Number(param(incoming.lat));
  const presetLng = Number(param(incoming.lng));
  const hasPreset = Number.isFinite(presetLat) && Number.isFinite(presetLng);

  const [name, setName] = useState(param(incoming.name) ?? "");
  const [notes, setNotes] = useState(param(incoming.notes) ?? "");
  const [latitude, setLatitude] = useState<number | null>(hasPreset ? presetLat : null);
  const [longitude, setLongitude] = useState<number | null>(hasPreset ? presetLng : null);
  const [gpsLabel, setGpsLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasPreset) return;
    let cancelled = false;
    (async () => {
      const coords = await currentCoords();
      if (cancelled) return;
      if (coords) {
        setLatitude((lat) => lat ?? coords.latitude);
        setLongitude((lng) => lng ?? coords.longitude);
        setGpsLabel(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      } else {
        setGpsLabel(t("locations.gpsUnavailable"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasPreset]);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("locations.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await apiAuth("/api/me/places", token, {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          notes: notes.trim() || null,
          latitude,
          longitude,
        }),
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("locations.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Subpage title={t("locations.newTitle")}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.name")}</Text>
        <TextInput
          className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          placeholder={t("locations.namePlaceholder")}
          placeholderTextColor="#6B7B6E"
          value={name}
          onChangeText={setName}
        />
        <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.notes")}</Text>
        <TextInput
          className="mb-4 min-h-[96px] rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          placeholder={t("locations.notesPlaceholder")}
          placeholderTextColor="#6B7B6E"
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.location")}</Text>
        <MiniMap
          latitude={latitude}
          longitude={longitude}
          onChange={({ latitude: lat, longitude: lng }) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        {latitude == null || longitude == null ? (
          <Text className="mb-2 text-sm text-[#9CA89F]">{gpsLabel || t("locations.gpsGetting")}</Text>
        ) : null}
        {error ? <Text className="mb-3 text-sm text-[#E8B86D]">{error}</Text> : null}
        <Pressable
          onPress={onSave}
          disabled={saving}
          className="items-center rounded-xl bg-[#2D5F3F] py-3 active:bg-[#4A7C5D]"
        >
          {saving ? (
            <ActivityIndicator color="#F5F5F0" />
          ) : (
            <Text className="text-base font-semibold text-[#F5F5F0]">{t("common.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </Subpage>
  );
}
