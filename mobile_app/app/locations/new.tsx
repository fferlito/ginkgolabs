import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Subpage } from "../../components/subpage";
import { ApiError, apiAuth } from "../../lib/api";
import { currentCoords } from "../../lib/geo";

export default function NewLocationScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLabel, setGpsLabel] = useState("Getting GPS…");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setGpsLabel("Location permission denied — saving without coordinates.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
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
      setError(err instanceof ApiError ? err.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Subpage title="New location">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-sm text-[#9CA89F]">Name</Text>
        <TextInput
          className="mb-4 rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          placeholder="e.g. Oak stand near the ridge"
          placeholderTextColor="#6B7B6E"
          value={name}
          onChangeText={setName}
        />
        <Text className="mb-2 text-sm text-[#9CA89F]">Notes</Text>
        <TextInput
          className="mb-4 min-h-[96px] rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3 text-[#F5F5F0]"
          placeholder="Optional details"
          placeholderTextColor="#6B7B6E"
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        <Text className="mb-2 text-sm text-[#9CA89F]">Coordinates</Text>
        <Text className="mb-6 text-sm text-[#F5F5F0]">{gpsLabel}</Text>
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
