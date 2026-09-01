import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Subpage({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-[#0A0E0C]" style={{ paddingTop: insets.top }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center px-4 py-3">
        <Text className="text-[#9CA89F]">← Back</Text>
      </Pressable>
      <View className="mb-4 flex-row items-center justify-between px-4">
        <Text className="flex-1 pr-3 text-2xl font-semibold text-[#F5F5F0]">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}
