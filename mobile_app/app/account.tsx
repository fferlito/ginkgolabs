import { useUser } from "@clerk/expo";
import { Check, ChevronDown, Globe, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Subpage } from "../components/subpage";
import { LanguageFlag } from "../components/language-flag";
import {
  EUROPEAN_LANGUAGES,
  getLanguagePreference,
  languageNativeName,
  setLanguagePreference,
  type LanguagePreference,
} from "../lib/i18n";

function ProfileCard({
  displayName,
  email,
  initials,
}: {
  displayName: string;
  email: string;
  initials: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="mx-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6">
      <Text className="mb-4 text-lg font-semibold text-[#4A7C5D]">{t("account.profile")}</Text>
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <Text className="text-xl font-medium text-[#A0AEC0]">{initials}</Text>
      </View>
      <Text className="text-sm text-[#9CA89F]">{t("common.name")}</Text>
      <Text className="mb-3 text-base text-[#F5F5F0]">{displayName}</Text>
      <Text className="text-sm text-[#9CA89F]">{t("common.email")}</Text>
      <Text className="text-base text-[#F5F5F0]">{email}</Text>
      <Text className="mt-4 text-sm text-[#9CA89F]">{t("account.managedByProvider")}</Text>
    </View>
  );
}

function LanguagePicker() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [pref, setPref] = useState<LanguagePreference>("system");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void getLanguagePreference().then(setPref);
  }, []);

  async function choose(next: LanguagePreference) {
    setPref(next);
    setOpen(false);
    setQuery("");
    await setLanguagePreference(next);
  }

  const selected =
    pref === "system" ? null : EUROPEAN_LANGUAGES.find((language) => language.code === pref);

  const selectedLabel =
    pref === "system" ? t("account.systemDefault") : languageNativeName(pref);

  const languages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...EUROPEAN_LANGUAGES].sort((a, b) =>
      a.nativeName.localeCompare(b.nativeName, "en", { sensitivity: "base" }),
    );
    if (!q) return rows;
    return rows.filter(
      (language) =>
        language.nativeName.toLowerCase().includes(q) ||
        language.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View className="mx-4 mt-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6">
      <Text className="mb-4 text-lg font-semibold text-[#4A7C5D]">{t("account.language")}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-[#2D5F3F] bg-[#1B3022] px-4 py-3"
      >
        <View className="flex-1 flex-row items-center gap-3 pr-3">
          {selected ? (
            <LanguageFlag flag={selected.flag} />
          ) : (
            <Globe color="#4A7C5D" size={20} />
          )}
          <Text className="flex-1 text-base font-medium text-[#F5F5F0]">{selectedLabel}</Text>
        </View>
        <ChevronDown color="#4A7C5D" size={20} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-[#0A0E0C]" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-lg font-semibold text-[#F5F5F0]">{t("account.language")}</Text>
            <Pressable
              onPress={() => {
                setOpen(false);
                setQuery("");
              }}
              hitSlop={8}
              accessibilityLabel={t("common.close")}
              className="rounded-lg p-1.5"
            >
              <X color="#9CA89F" size={20} />
            </Pressable>
          </View>
          <View className="mx-4 mb-3 flex-row items-center rounded-xl border border-[#2D5F3F]/40 bg-[#1B3022] px-3">
            <Search color="#9CA89F" size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("account.searchLanguage")}
              placeholderTextColor="#6B7B6E"
              className="ml-2 flex-1 py-2.5 text-[#F5F5F0]"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          >
            <Pressable
              onPress={() => choose("system")}
              className={`mb-2 flex-row items-center justify-between rounded-xl border-2 px-4 py-3 ${
                pref === "system" ? "border-[#2D5F3F] bg-[#2D5F3F]" : "border-[#2D5F3F]/30"
              }`}
            >
              <View className="flex-1 flex-row items-center gap-3 pr-3">
                <Globe color="#F5F5F0" size={20} />
                <Text className="flex-1 text-base font-medium text-[#F5F5F0]">{t("account.systemDefault")}</Text>
              </View>
              {pref === "system" ? <Check color="#F5F5F0" size={18} /> : null}
            </Pressable>
            {languages.map((language) => {
              const active = pref === language.code;
              return (
                <Pressable
                  key={language.code}
                  onPress={() => choose(language.code)}
                  className={`mb-2 flex-row items-center justify-between rounded-xl border-2 px-4 py-3 ${
                    active ? "border-[#2D5F3F] bg-[#2D5F3F]" : "border-[#2D5F3F]/30"
                  }`}
                >
                  <View className="flex-1 flex-row items-center gap-3 pr-3">
                    <LanguageFlag flag={language.flag} />
                    <Text className="flex-1 text-base font-medium text-[#F5F5F0]">{language.nativeName}</Text>
                  </View>
                  {active ? <Check color="#F5F5F0" size={18} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ClerkAccount() {
  const { t } = useTranslation();
  const { user } = useUser();
  const displayName =
    user?.firstName || user?.lastName
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t("common.user")
      : t("common.user");
  const email = user?.primaryEmailAddress?.emailAddress ?? "user@example.com";
  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.firstName?.[0] ?? email[0] ?? "?").toUpperCase();
  return <ProfileCard displayName={displayName} email={email} initials={initials} />;
}

export default function AccountScreen() {
  const { t } = useTranslation();
  const hasClerk = !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <Subpage title={t("account.title")}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {hasClerk ? (
          <ClerkAccount />
        ) : (
          <ProfileCard displayName={t("common.guest")} email="—" initials="G" />
        )}
        <LanguagePicker />
      </ScrollView>
    </Subpage>
  );
}
