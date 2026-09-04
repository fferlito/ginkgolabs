import Mapbox, { Camera, MapView, PointAnnotation } from "@rnmapbox/maps";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { currentCoords } from "../lib/geo";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

const STYLE_URL = "mapbox://styles/ferlixxx/cm8xkvecy000o01s6fy1h60qi";
const FALLBACK: [number, number] = [11.3285, 43.3188];

function Pin() {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#4A7C5D",
          borderWidth: 3,
          borderColor: "#F5F5F0",
        }}
      />
    </View>
  );
}

export function MiniMap({
  latitude,
  longitude,
  onChange,
  onOpen,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange?: (coords: { latitude: number; longitude: number }) => void;
  onOpen?: () => void;
}) {
  const cameraRef = useRef<Camera>(null);
  const { t } = useTranslation();
  const hadPoint = useRef(Number.isFinite(latitude) && Number.isFinite(longitude));
  const editable = typeof onChange === "function";
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
  const coordinate: [number, number] = hasPoint
    ? [longitude as number, latitude as number]
    : FALLBACK;

  useEffect(() => {
    if (!hasPoint) {
      hadPoint.current = false;
      return;
    }
    if (!hadPoint.current) {
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude as number, latitude as number],
        animationDuration: 280,
      });
    }
    hadPoint.current = true;
  }, [hasPoint, latitude, longitude]);

  if (!hasPoint && !editable) return null;

  function moveTo(lat: number, lng: number, recenter = true) {
    onChange?.({ latitude: lat, longitude: lng });
    if (recenter) {
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        animationDuration: 280,
      });
    }
  }

  return (
    <View className="mb-4">
      <View className="overflow-hidden rounded-xl border border-[#2D5F3F]/30" style={{ height: 176 }}>
        <MapView
          style={{ flex: 1 }}
          styleURL={STYLE_URL}
          scaleBarEnabled={false}
          compassEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          scrollEnabled={editable}
          zoomEnabled={editable}
          rotateEnabled={false}
          pitchEnabled={false}
          onPress={(feature) => {
            if (!editable) return;
            const coords = feature.geometry?.coordinates;
            if (!coords || coords.length < 2) return;
            moveTo(coords[1], coords[0]);
          }}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: coordinate,
              zoomLevel: 14,
              animationDuration: 0,
            }}
          />
          {hasPoint || editable ? (
            <PointAnnotation
              id="mini-map-pin"
              coordinate={coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              draggable={editable}
              onDragEnd={(payload) => {
                const coords = payload.geometry?.coordinates;
                if (!coords || coords.length < 2) return;
                moveTo(coords[1], coords[0], false);
              }}
            >
              <Pin />
            </PointAnnotation>
          ) : null}
        </MapView>
        {onOpen && !editable ? (
          <Pressable
            onPress={onOpen}
            accessibilityLabel={t("miniMap.openHint")}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 2,
              elevation: 4,
            }}
          />
        ) : null}
      </View>
      {editable ? (
        <>
          <Text className="mt-2 text-xs text-[#9CA89F]">{t("miniMap.dragHint")}</Text>
          <Pressable
            onPress={async () => {
              const coords = await currentCoords();
              if (coords) moveTo(coords.latitude, coords.longitude);
            }}
            className="mt-2 items-center rounded-xl border border-[#2D5F3F] py-2"
          >
            <Text className="text-sm font-medium text-[#F5F5F0]">{t("miniMap.useGps")}</Text>
          </Pressable>
        </>
      ) : onOpen ? (
        <Text className="mt-2 text-xs text-[#9CA89F]">{t("miniMap.openHint")}</Text>
      ) : null}
    </View>
  );
}
