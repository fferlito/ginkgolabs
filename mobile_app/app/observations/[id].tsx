import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, Leaf, Pencil } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { DateField } from "../../components/date-field";
import { MiniMap } from "../../components/mini-map";
import { MushroomIcon } from "../../components/mushroom-icon";
import { ObservationActions } from "../../components/observation-actions";
import { Subpage } from "../../components/subpage";
import boletus from "../../data/mushrooms/boletus_edulis.json";
import cantharellus from "../../data/mushrooms/Cantharellus.json";
import morchella from "../../data/mushrooms/galletto.json";
import psilocybe from "../../data/mushrooms/Psilocybe.json";
import type { MushroomData } from "../../data/mushrooms/types";
import { ApiError, apiAuth, type Observation } from "../../lib/api";
import { mushroomCommonName } from "../../lib/i18n";
import { upsertMapPlacePin } from "../../lib/map-place-pins";

const catalog = [boletus, cantharellus, morchella, psilocybe] as MushroomData[];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-[#9CA89F]">{label}</Text>
      <Text className="text-base text-[#F5F5F0]">{value}</Text>
    </View>
  );
}

function fillFrom(obs: Observation) {
  const matched = catalog.find(
    (m) => m.scientificName === obs.scientificName || m.name === obs.speciesName,
  );
  return {
    selected: matched ?? catalog[0],
    customName: matched ? "" : obs.speciesName,
    date: obs.observedOn,
    notes: obs.notes ?? "",
    isPublic: obs.isPublic,
    latitude: String(obs.latitude),
    longitude: String(obs.longitude),
  };
}

export default function ObservationDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { id } = useLocalSearchParams<{ id: string }>();
  const observationId = Array.isArray(id) ? id[0] : id;

  const [obs, setObs] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<MushroomData>(catalog[0]);
  const [customName, setCustomName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const load = useCallback(async () => {
    if (!observationId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const all = await apiAuth<Observation[]>("/api/me/observations", token);
      const data = all.find((row) => row.id === observationId);
      if (!data) throw new ApiError(404, t("observations.notFound"));
      setObs(data);
      const form = fillFrom(data);
      setSelected(form.selected);
      setCustomName(form.customName);
      setDate(form.date);
      setNotes(form.notes);
      setIsPublic(form.isPublic);
      setLatitude(form.latitude);
      setLongitude(form.longitude);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("observations.loadOneError"));
    } finally {
      setLoading(false);
    }
  }, [observationId]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit() {
    if (!obs) return;
    const form = fillFrom(obs);
    setSelected(form.selected);
    setCustomName(form.customName);
    setDate(form.date);
    setNotes(form.notes);
    setIsPublic(form.isPublic);
    setLatitude(form.latitude);
    setLongitude(form.longitude);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (obs) {
      const form = fillFrom(obs);
      setSelected(form.selected);
      setCustomName(form.customName);
      setDate(form.date);
      setNotes(form.notes);
      setIsPublic(form.isPublic);
      setLatitude(form.latitude);
      setLongitude(form.longitude);
    }
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!observationId) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(t("observations.coordsMustBeNumbers"));
      return;
    }
    const speciesName = customName.trim() || selected.name;
    const scientificName = customName.trim()
      ? (obs?.scientificName || customName.trim())
      : selected.scientificName;
    setSaving(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const data = await apiAuth<Observation>(`/api/me/observations/${observationId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          speciesName,
          scientificName,
          observedOn: date.trim(),
          latitude: lat,
          longitude: lng,
          isPublic,
          notes: notes.trim() || null,
        }),
      });
      setObs(data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("observations.saveChangesError"));
    } finally {
      setSaving(false);
    }
  }

  function goToLocation() {
    if (!obs) return;
    upsertMapPlacePin({
      id: obs.id,
      name: obs.speciesName,
      notes: obs.notes ?? null,
      latitude: obs.latitude,
      longitude: obs.longitude,
      photoUrl: obs.photoUrl,
    });
    router.dismissTo({
      pathname: "/map",
      params: {
        placeId: obs.id,
        lat: String(obs.latitude),
        lng: String(obs.longitude),
        name: obs.speciesName,
        notes: obs.notes ?? "",
        ts: String(Date.now()),
      },
    });
  }

  function saveAsLocation() {
    if (!obs) return;
    router.push({
      pathname: "/locations/new",
      params: {
        name: mushroomCommonName(obs),
        notes: obs.notes ?? "",
        lat: String(obs.latitude),
        lng: String(obs.longitude),
      },
    });
  }

  if (loading || !obs) {
    return (
      <Subpage title={t("observations.titleFallback")}>
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
      title={editing ? t("observations.editTitle") : mushroomCommonName(obs)}
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
        {obs.photoUrl ? (
          <Image source={{ uri: obs.photoUrl }} className="mb-4 h-64 w-full rounded-xl" />
        ) : (
          <View className="mb-4 h-64 items-center justify-center rounded-xl bg-[#1B3022]">
            <Leaf color="#4A7C5D" size={36} />
          </View>
        )}

        {editing ? (
          <>
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("observations.species")}</Text>
            <View className="mb-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-2">
              {catalog.map((mushroom) => {
                const active = selected.scientificName === mushroom.scientificName && !customName;
                return (
                  <Pressable
                    key={mushroom.scientificName}
                    onPress={() => {
                      setSelected(mushroom);
                      setCustomName("");
                    }}
                    className={`mb-0.5 flex-row items-center gap-3 rounded-lg px-3 py-2.5 ${
                      active ? "bg-[#2D5F3F]" : "active:bg-[#2D5F3F]/50"
                    }`}
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#1B3022]">
                      <MushroomIcon
                        name={mushroom.name}
                        scientificName={mushroom.scientificName}
                        id={mushroom.id}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-[#F5F5F0]">{mushroomCommonName(mushroom)}</Text>
                      <Text className="text-xs italic text-[#9CA89F]">{mushroom.scientificName}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("observations.customName")}</Text>
            <TextInput
              className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
              value={customName}
              onChangeText={setCustomName}
              placeholder={t("observations.customPlaceholder")}
              placeholderTextColor="#6B7B6E"
            />
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.date")}</Text>
            <DateField value={date} onChange={setDate} />
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.location")}</Text>
            <MiniMap
              latitude={Number(latitude)}
              longitude={Number(longitude)}
              onChange={({ latitude: lat, longitude: lng }) => {
                setLatitude(String(lat));
                setLongitude(String(lng));
              }}
            />
            <Text className="mb-2 text-sm text-[#9CA89F]">{t("common.notes")}</Text>
            <TextInput
              className="mb-4 min-h-[96px] rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
              placeholder={t("observations.habitatPlaceholder")}
              placeholderTextColor="#6B7B6E"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-4 py-3">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-medium text-[#F5F5F0]">{t("observations.makePublic")}</Text>
                <Text className="text-xs text-[#9CA89F]">{t("observations.makePublicHint")}</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: "#1B3022", true: "#2D5F3F" }}
                thumbColor={isPublic ? "#4A7C5D" : "#9CA89F"}
              />
            </View>
          </>
        ) : (
          <>
            <Field label={t("observations.species")} value={mushroomCommonName(obs)} />
            {obs.scientificName ? <Field label={t("observations.scientificName")} value={obs.scientificName} /> : null}
            <Field label={t("common.date")} value={obs.observedOn} />
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm text-[#9CA89F]">{t("common.location")}</Text>
              <Pressable
                onPress={saveAsLocation}
                accessibilityLabel={t("observations.saveLocation")}
                className="h-9 w-9 items-center justify-center"
              >
                <Bookmark color="#9CA89F" size={20} />
              </Pressable>
            </View>
            <MiniMap latitude={obs.latitude} longitude={obs.longitude} onOpen={goToLocation} />
            <ObservationActions
              name={mushroomCommonName(obs)}
              scientificName={obs.scientificName}
              latitude={obs.latitude}
              longitude={obs.longitude}
            />
            <Field label={t("observations.visibility")} value={obs.isPublic ? t("observations.public") : t("observations.private")} />
            <Field label={t("observations.source")} value={obs.source === "scan" ? t("observations.sourceScan") : t("observations.sourceManual")} />
            <Field label={t("common.notes")} value={obs.notes?.trim() ? obs.notes : t("common.none")} />
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
