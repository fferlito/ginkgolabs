import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { Subpage } from "../components/subpage";

function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <View className="mb-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-5">
      <Text className="mb-2 text-xl font-semibold text-[#4A7C5D]">{title}</Text>
      <Text className="mb-3 text-sm text-[#9CA89F]">{t("legal.lastUpdated")}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: string }) {
  return <Text className="mb-3 text-[#F5F5F0]/90">{children}</Text>;
}

function Heading({ children }: { children: string }) {
  return <Text className="mb-2 pt-1 text-lg font-medium text-[#F5F5F0]">{children}</Text>;
}

export default function PrivacyScreen() {
  const { t } = useTranslation();
  return (
    <Subpage title={t("legal.title")}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <LegalBlock title={t("legal.privacyTitle")}>
          <Para>{t("legal.privacyIntro")}</Para>
          <Heading>{t("legal.infoTitle")}</Heading>
          <Para>{t("legal.infoBody")}</Para>
          <Heading>{t("legal.useTitle")}</Heading>
          <Para>{t("legal.useBody")}</Para>
          <Heading>{t("legal.securityTitle")}</Heading>
          <Para>{t("legal.securityBody")}</Para>
          <Heading>{t("legal.contactTitle")}</Heading>
          <Para>{t("legal.contactBody")}</Para>
        </LegalBlock>

        <LegalBlock title={t("legal.termsTitle")}>
          <Para>{t("legal.termsIntro")}</Para>
          <Heading>{t("legal.serviceTitle")}</Heading>
          <Para>{t("legal.serviceBody")}</Para>
          <Heading>{t("legal.acceptableTitle")}</Heading>
          <Para>{t("legal.acceptableBody")}</Para>
          <Heading>{t("legal.disclaimerTitle")}</Heading>
          <Para>{t("legal.disclaimerBody")}</Para>
          <Heading>{t("legal.changesTitle")}</Heading>
          <Para>{t("legal.changesBody")}</Para>
        </LegalBlock>
      </ScrollView>
    </Subpage>
  );
}
