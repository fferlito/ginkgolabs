import { Image, type ImageSourcePropType } from "react-native";
import { Leaf } from "lucide-react-native";

const ICONS: Record<string, ImageSourcePropType> = {
  "boletus edulis": require("../assets/mushrooms/mushroom.png"),
  porcini: require("../assets/mushrooms/mushroom.png"),
  "cantharellus cibarius": require("../assets/mushrooms/galletto.png"),
  galletto: require("../assets/mushrooms/galletto.png"),
  morchella: require("../assets/mushrooms/Morchella.png"),
  "psilocybe cubensis": require("../assets/mushrooms/Psilocybe.png"),
  psilocybe: require("../assets/mushrooms/Psilocybe.png"),
};

function resolveSource(...keys: (string | undefined)[]): ImageSourcePropType | undefined {
  for (const key of keys) {
    if (!key) continue;
    const normalized = key.trim().toLowerCase();
    if (ICONS[normalized]) return ICONS[normalized];
    for (const [name, source] of Object.entries(ICONS)) {
      if (normalized.includes(name) || name.includes(normalized)) return source;
    }
  }
  return undefined;
}

export function MushroomIcon({
  name,
  scientificName,
  id,
  size = 20,
}: {
  name?: string;
  scientificName?: string;
  id?: string;
  size?: number;
}) {
  const source = resolveSource(scientificName, id, name);
  if (!source) {
    return <Leaf color="#4A7C5D" size={size} />;
  }
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
      resizeMethod="resize"
    />
  );
}
