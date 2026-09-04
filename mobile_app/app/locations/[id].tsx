import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Map, Pencil } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MiniMap } from "../../components/mini-map";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth, type Place } from "../../lib/api";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-[#9CA89F]">{label}</Text>
      <Text className="text-base text-[#F5F5F0]">{value}</Text>
    </View>
  );
}

function fillFrom(place: Place) {
  return {
    name: place.name,
    notes: place.notes ?? "",
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export default function LocationDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Array.isArray(id) ? id[0] : id;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const all = await apiAuth<Place[]>("/api/me/places", token);
      const data = all.find((row) => row.id === placeId);
      if (!data) throw new ApiError(404, t("locations.notFound"));
      setPlace(data);
      const form = fillFrom(data);
      setName(form.name);
      setNotes(form.notes);
      setLatitude(form.latitude);
      setLongitude(form.longitude);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("locations.loadOneError"));
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit() {
    if (!place) return;
    const form = fillFrom(place);
    setName(form.name);
    setNotes(form.notes);
    setLatitude(form.latitude);
    setLongitude(form.longitude);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (place) {
      const form = fillFrom(place);
      setName(form.name);
      setNotes(form.notes);
      setLatitude(form.latitude);
      setLongitude(form.longitude);
    }
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!placeId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("locations.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const body: Record<string, unknown> = {
        name: trimmed,
        notes: notes.trim(),
      };
      if (latitude != null && longitude != null) {
        body.latitude = latitude;
        body.longitude = longitude;
      }
      const data = await apiAuth<Place>(`/api/me/places/${placeId}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setPlace(data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("locations.saveChangesError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !place) {
    return (
      <Subpage title={t("common.location")}>
        <View className="flex-1 items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#4A7C5D" />
          ) : (
            <Text className="px-4 text-center text-sm text-[#E8B86D]">{error ?? t("common.notFound")}</Text>
          )}
        </View>
      </Subpage>
    );
  }

  return (
    <Subpage
      title={editing ? t("locations.editTitle") : place.name}
      action={
        editing ? undefined : (
          <Pressable
            onPress={startEdit}
            accessibilityLabel={t("common.edit")}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-[#2D5F3F] bg-[#2D5F3F] active:bg-[#4A7C5D]"
          >
            <Pencil color="#F5F5F0" size={18} strokeWidth={2.5} />
          </Pressable>
        )
      }
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <>
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.name")}</Text>
            <TextInput
              className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
              value={name}
              onChangeText={setName}
              placeholder={t("locations.namePlaceholder")}
              placeholderTextColor="#6B7B6E"
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
          </>
        ) : (
          <>
            <Field label={t("common.name")} value={place.name} />
            <Field label={t("common.notes")} value={place.notes?.trim() ? place.notes : t("common.none")} />
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.location")}</Text>
            {place.latitude != null && place.longitude != null ? (
              <MiniMap
                latitude={place.latitude}
                longitude={place.longitude}
                onOpen={() => {
                  router.dismissTo({
                    pathname: "/map",
                    params: {
                      placeId: place.id,
                      lat: String(place.latitude),
                      lng: String(place.longitude),
                      name: place.name,
                      notes: place.notes ?? "",
                      ts: String(Date.now()),
                    },
                  });
                }}
              />
            ) : (
              <View className="mb-4 items-center rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-4 py-10">
                <Map color="#4A7C5D" size={28} />
                <Text className="mt-2 text-sm text-[#9CA89F]">{t("locations.noCoordinates")}</Text>
              </View>
            )}
          </>
        )}

        {error ? <Text className="mb-3 text-sm text-[#E8B86D]">{error}</Text> : null}

        {editing ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={cancelEdit}
              disabled={saving}
              className="flex-1 items-center rounded-xl border border-[#2D5F3F] py-3"
            >
              <Text className="font-semibold text-[#F5F5F0]">{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={saveEdit}
              disabled={saving}
              className="flex-1 items-center rounded-xl bg-[#2D5F3F] py-3"
            >
              {saving ? (
                <ActivityIndicator color="#F5F5F0" />
              ) : (
                <Text className="font-semibold text-[#F5F5F0]">{t("common.done")}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Subpage>
  );
}

