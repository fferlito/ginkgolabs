import { Image, type ImageSourcePropType, Pressable, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export type MapStyleId = "custom" | "satellite";

const PREVIEW = {
  custom: require("../assets/map-preview-basemap.png"),
  satellite: require("../assets/map-preview-terrain.png"),
};

type Props = {
  mapStyle: MapStyleId;
  onMapStyle: (style: MapStyleId) => void;
  showLocations: boolean;
  onShowLocations: (value: boolean) => void;
  showObservations: boolean;
  onShowObservations: (value: boolean) => void;
  showCommunity: boolean;
  onShowCommunity: (value: boolean) => void;
};

function StyleSquare({
  label,
  selected,
  source,
  onPress,
}: {
  label: string;
  selected: boolean;
  source: ImageSourcePropType;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center" }}>
      <View
        style={{
          height: 88,
          width: "100%",
          overflow: "hidden",
          borderRadius: 14,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? "#4A7C5D" : "rgba(245,245,240,0.18)",
          backgroundColor: "#1B3022",
        }}
      >
        <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      </View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: "600",
          color: selected ? "#F5F5F0" : "#9CA89F",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LayerToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingVertical: 12,
      }}
    >
      <Text style={{ flex: 1, marginRight: 12, fontSize: 14, color: "#F5F5F0" }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#1B3022", true: "#2D5F3F" }}
        thumbColor={value ? "#4A7C5D" : "#9CA89F"}
      />
    </View>
  );
}

export function MapLayersPanel({
  mapStyle,
  onMapStyle,
  showLocations,
  onShowLocations,
  showObservations,
  onShowObservations,
  showCommunity,
  onShowCommunity,
}: Props) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        width: 248,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(45,95,63,0.5)",
        backgroundColor: "#0A0E0C",
        paddingHorizontal: 12,
        paddingTop: 12,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
        <StyleSquare
          label={t("map.basemap")}
          selected={mapStyle === "custom"}
          source={PREVIEW.custom}
          onPress={() => onMapStyle("custom")}
        />
        <StyleSquare
          label={t("map.terrain")}
          selected={mapStyle === "satellite"}
          source={PREVIEW.satellite}
          onPress={() => onMapStyle("satellite")}
        />
      </View>
      <View style={{ marginTop: 8 }}>
        <LayerToggle label={t("map.showLocations")} value={showLocations} onValueChange={onShowLocations} />
        <LayerToggle label={t("map.showObservations")} value={showObservations} onValueChange={onShowObservations} />
        <LayerToggle label={t("map.showCommunity")} value={showCommunity} onValueChange={onShowCommunity} />
      </View>
    </View>
  );
}
