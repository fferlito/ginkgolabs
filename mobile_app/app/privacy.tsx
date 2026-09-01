import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Subpage } from "../components/subpage";

function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-5">
      <Text className="mb-2 text-xl font-semibold text-[#4A7C5D]">{title}</Text>
      <Text className="mb-3 text-sm text-[#9CA89F]">Last updated: February 2025</Text>
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
  return (
    <Subpage title="Legal">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <LegalBlock title="Privacy Policy">
          <Para>
            MushroomRadar respects your privacy. This policy describes how we collect, use, and
            protect your information when you use our services.
          </Para>
          <Heading>Information we collect</Heading>
          <Para>
            We collect information you provide directly (e.g. account details, preferences) and
            usage data (e.g. map views, feature usage) to improve our predictions and your
            experience.
          </Para>
          <Heading>How we use it</Heading>
          <Para>
            We use collected data to operate and improve MushroomRadar, personalize content,
            communicate with you, and comply with legal obligations. We do not sell your personal
            data.
          </Para>
          <Heading>Data security</Heading>
          <Para>
            We implement appropriate technical and organizational measures to protect your data
            against unauthorized access, alteration, or loss.
          </Para>
          <Heading>Contact</Heading>
          <Para>For privacy-related questions, contact us at privacy@mushroomradar.example.</Para>
        </LegalBlock>

        <LegalBlock title="Terms of Use">
          <Para>By using MushroomRadar you agree to these terms. Please read them carefully.</Para>
          <Heading>Use of the service</Heading>
          <Para>
            MushroomRadar provides predictive maps and information for educational and recreational
            purposes. Predictions are not guaranteed. Always verify species and follow local
            regulations before foraging.
          </Para>
          <Heading>Acceptable use</Heading>
          <Para>
            You may not misuse the service, attempt to gain unauthorized access, scrape data at
            scale, or use it for any illegal purpose. We may suspend or terminate access for
            violations.
          </Para>
          <Heading>Disclaimer</Heading>
          <Para>
            MushroomRadar is provided as is. We are not liable for any decisions made based on our
            predictions. Foraging carries inherent risks; you are responsible for your own safety
            and compliance with laws.
          </Para>
          <Heading>Changes</Heading>
          <Para>
            We may update these terms from time to time. Continued use after changes constitutes
            acceptance. Contact: legal@mushroomradar.example.
          </Para>
        </LegalBlock>
      </ScrollView>
    </Subpage>
  );
}
