import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

export function AddEntryButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full border-2 border-[#2D5F3F] bg-[#2D5F3F] active:bg-[#4A7C5D]"
    >
      <Plus color="#F5F5F0" size={20} strokeWidth={2.5} />
    </Pressable>
  );
}
