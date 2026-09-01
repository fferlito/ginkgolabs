import { useAuth } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { MushroomIcon } from "../../components/mushroom-icon";
import { Subpage } from "../../components/subpage";
import boletus from "../../data/mushrooms/boletus_edulis.json";
import cantharellus from "../../data/mushrooms/Cantharellus.json";
import morchella from "../../data/mushrooms/galletto.json";
import psilocybe from "../../data/mushrooms/Psilocybe.json";
import type { MushroomData } from "../../data/mushrooms/types";
import { ApiError, apiAuth } from "../../lib/api";
import { currentCoords } from "../../lib/geo";
import { takePendingScanPhoto } from "../../lib/pending-scan";

const catalog = [boletus, cantharellus, morchella, psilocybe] as MushroomData[];

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function NewObservationScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    speciesName?: string;
    scientificName?: string;
    source?: string;
  }>();
  const fromScan = params.source === "scan";

  const matched = catalog.find(
    (m) =>
      m.scientificName === params.scientificName ||
      m.name === params.speciesName,
  );
  const [selected, setSelected] = useState<MushroomData>(matched ?? catalog[0]);
  const [customName, setCustomName] = useState(
    matched ? "" : (params.speciesName || params.scientificName || ""),
  );
  const [date, setDate] = useState(todayYmd());
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLabel, setGpsLabel] = useState("Getting GPS…");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pending = takePendingScanPhoto();
    if (pending) {
      setPhotoUri(pending.uri);
      setPhotoMime(pending.mimeType ?? "image/jpeg");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await currentCoords();
      if (cancelled) return;
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setGpsLabel(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      } else {
        setGpsLabel("Location permission denied.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setPhotoMime(asset.mimeType ?? "image/jpeg");
  }

  async function onSave() {
    if (!photoUri) {
      setError("A photo is required.");
      return;
    }
    if (latitude == null || longitude == null) {
      setError("Coordinates are required. Enable location and try again.");
      return;
    }
    const speciesName = customName.trim() || selected.name;
    const scientificName = customName.trim()
      ? (params.scientificName || customName.trim())
      : selected.scientificName;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const upload = await apiAuth<{ uploadUrl: string; objectKey: string }>(
        "/api/me/observations/upload-url",
        token,
        {
          method: "POST",
          body: JSON.stringify({ contentType: photoMime, isPublic }),
        },
      );
      const fileRes = await fetch(photoUri);
      const body = await fileRes.blob();
      const put = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": photoMime },
        body,
      });
      if (!put.ok) throw new ApiError(put.status, "Photo upload failed.");
      await apiAuth("/api/me/observations", token, {
        method: "POST",
        body: JSON.stringify({
          speciesId: customName.trim() ? null : selected.id ?? null,
          speciesName,
          scientificName,
          observedOn: date,
          latitude,
          longitude,
          isPublic,
          notes: notes.trim() || null,
          objectKey: upload.objectKey,
          source: fromScan ? "scan" : "manual",
        }),
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save observation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Subpage title="New observation">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {fromScan ? (
          <>
            <Text className="mb-2 text-sm text-[#9CA89F]">Identified species</Text>
            <Text className="mb-4 text-base font-semibold text-[#F5F5F0]">
              {customName || selected.name}
            </Text>
            {params.scientificName ? (
              <Text className="-mt-3 mb-4 text-xs italic text-[#9CA89F]">{params.scientificName}</Text>
            ) : null}
          </>
        ) : (
          <>
            <Text className="mb-2 text-sm text-[#9CA89F]">Species</Text>
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
                      <Text className="text-sm font-medium text-[#F5F5F0]">{mushroom.name}</Text>
                      <Text className="text-xs italic text-[#9CA89F]">{mushroom.scientificName}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text className="mb-2 text-sm text-[#9CA89F]">Date</Text>
        <TextInput
          className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6B7B6E"
        />

        <Text className="mb-2 text-sm text-[#9CA89F]">Notes</Text>
        <TextInput
          className="mb-4 min-h-[96px] rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          placeholder="Habitat, quantity, weather…"
          placeholderTextColor="#6B7B6E"
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />

        <View className="mb-4 flex-row items-center justify-between rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-medium text-[#F5F5F0]">Make public</Text>
            <Text className="text-xs text-[#9CA89F]">
              Off by default. Public entries can include this find later; coordinates stay private for now.
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: "#1B3022", true: "#2D5F3F" }}
            thumbColor={isPublic ? "#4A7C5D" : "#9CA89F"}
          />
        </View>

        <Text className="mb-2 text-sm text-[#9CA89F]">Photo</Text>
        <Pressable
          onPress={pickPhoto}
          className="mb-4 items-center overflow-hidden rounded-xl border border-dashed border-[#2D5F3F] bg-[#1B3022]/40 active:bg-[#1B3022]"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-48 w-full" />
          ) : (
            <Text className="py-10 text-sm text-[#9CA89F]">Add a photo</Text>
          )}
        </Pressable>

        <Text className="mb-6 text-sm text-[#9CA89F]">GPS: {gpsLabel}</Text>
        {error ? <Text className="mb-3 text-sm text-[#E8B86D]">{error}</Text> : null}
        <Pressable
          onPress={onSave}
          disabled={saving}
          className="items-center rounded-xl bg-[#2D5F3F] py-3 active:bg-[#4A7C5D]"
        >
          {saving ? (
            <ActivityIndicator color="#F5F5F0" />
          ) : (
            <Text className="text-base font-semibold text-[#F5F5F0]">Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </Subpage>
  );
}
