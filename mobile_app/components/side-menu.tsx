import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Camera,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.78, 320);

const MENU_ITEMS: { id: string; href: string; icon: LucideIcon; labelKey: string }[] = [
  { id: "account", labelKey: "menu.account", href: "/account", icon: User },
  { id: "locations", labelKey: "menu.locations", href: "/locations", icon: MapPin },
  { id: "observations", labelKey: "menu.observations", href: "/observations", icon: Leaf },
  { id: "scan", labelKey: "menu.scan", href: "/scan", icon: Camera },
  { id: "mushroompedia", labelKey: "menu.mushroompedia", href: "/mushroompedia", icon: BookOpen },
  { id: "privacy", labelKey: "menu.legal", href: "/privacy", icon: Shield },
];

export function MenuButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={t("menu.openMenu")}
      className="h-12 w-12 items-center justify-center rounded-full border-2 border-[#2D5F3F] bg-[#2D5F3F]"
    >
      <Menu color="#F5F5F0" size={24} strokeWidth={2} />
    </Pressable>
  );
}

function initialsFromName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return (parts[0]?.[0] ?? "G").toUpperCase();
}

function MenuLink({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="w-full flex-row items-center gap-3 px-6 py-3 active:bg-white/5">
      <Icon color="#4A7C5D" size={18} strokeWidth={2} />
      <Text className="flex-1 text-left text-base text-[#F5F5F0]">{label}</Text>
    </Pressable>
  );
}

function MenuBody({
  name,
  initials,
  onClose,
  onLogout,
}: {
  name: string;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <>
      <View className="items-center px-6 pb-4">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Text className="text-lg font-medium text-[#A0AEC0]">{initials}</Text>
        </View>
        <Text className="text-base font-semibold text-[#F5F5F0]">{name}</Text>
      </View>

      <View className="mx-6 mb-2 h-px bg-white/10" />

      {MENU_ITEMS.map((item) => (
        <MenuLink
          key={item.id}
          label={t(item.labelKey)}
          icon={item.icon}
          onPress={() => {
            onClose();
            router.push(item.href);
          }}
        />
      ))}

      <View className="mx-6 my-2 h-px bg-white/10" />

      <MenuLink label={t("menu.logOut")} icon={LogOut} onPress={onLogout} />
    </>
  );
}

function ClerkMenuBody({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const name =
    user?.firstName ??
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
    "User";
  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "?").toUpperCase();

  return (
    <MenuBody
      name={name}
      initials={initials}
      onClose={onClose}
      onLogout={async () => {
        onClose();
        await signOut();
        router.replace("/login");
      }}
    />
  );
}

function SideDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const hasClerk = !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      slide.setValue(-DRAWER_WIDTH);
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(slide, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [open, slide]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, elevation: 32 }}
    >
      <Pressable className="absolute inset-0" onPress={onClose} />
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: DRAWER_WIDTH,
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "#0A0E0C",
          borderRightWidth: 1,
          borderRightColor: "rgba(45, 95, 63, 0.3)",
          elevation: 32,
          zIndex: 101,
          transform: [{ translateX: slide }],
        }}
      >
        {hasClerk ? (
          <ClerkMenuBody onClose={onClose} />
        ) : (
          <MenuBody
            name="Guest"
            initials={initialsFromName("Guest")}
            onClose={onClose}
            onLogout={onClose}
          />
        )}
      </Animated.View>
    </View>
  );
}

export function SideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return <SideDrawer open={open} onClose={onClose} />;
}
