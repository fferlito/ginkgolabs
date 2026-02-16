import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";

export function PrivacyTermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0E0C]">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <Link to="/app/dashboard">
          <Button
            variant="ghost"
            className="mb-6 -ml-2 text-[#9CA89F] hover:text-[#F5F5F0] hover:bg-[#1B3022]/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F0] mb-6">
          Legal
        </h1>

        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="mb-6 bg-[#1B3022]/60 border border-[#2D5F3F]/30 p-1">
            <TabsTrigger
              value="privacy"
              className="data-[state=active]:bg-[#2D5F3F] data-[state=active]:text-[#F5F5F0] text-[#9CA89F]"
            >
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger
              value="terms"
              className="data-[state=active]:bg-[#2D5F3F] data-[state=active]:text-[#F5F5F0] text-[#9CA89F]"
            >
              Terms of Use
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="mt-0">
            <article className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 text-[#F5F5F0] space-y-4">
              <h2 className="text-xl font-semibold text-[#4A7C5D]">
                Privacy Policy
              </h2>
              <p className="text-sm text-[#9CA89F]">Last updated: February 2025</p>
              <p className="text-[#F5F5F0]/90">
                MushroomRadar respects your privacy. This policy describes how we collect, use, and protect your information when you use our services.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Information we collect
              </h3>
              <p className="text-[#F5F5F0]/90">
                We collect information you provide directly (e.g. account details, preferences) and usage data (e.g. map views, feature usage) to improve our predictions and your experience.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                How we use it
              </h3>
              <p className="text-[#F5F5F0]/90">
                We use collected data to operate and improve MushroomRadar, personalize content, communicate with you, and comply with legal obligations. We do not sell your personal data.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Data security
              </h3>
              <p className="text-[#F5F5F0]/90">
                We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or loss.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Contact
              </h3>
              <p className="text-[#F5F5F0]/90">
                For privacy-related questions, contact us at privacy@mushroomradar.example.
              </p>
            </article>
          </TabsContent>

          <TabsContent value="terms" className="mt-0">
            <article className="rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/40 p-6 sm:p-8 text-[#F5F5F0] space-y-4">
              <h2 className="text-xl font-semibold text-[#4A7C5D]">
                Terms of Use
              </h2>
              <p className="text-sm text-[#9CA89F]">Last updated: February 2025</p>
              <p className="text-[#F5F5F0]/90">
                By using MushroomRadar you agree to these terms. Please read them carefully.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Use of the service
              </h3>
              <p className="text-[#F5F5F0]/90">
                MushroomRadar provides predictive maps and information for educational and recreational purposes. Predictions are not guaranteed. Always verify species and follow local regulations before foraging.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Acceptable use
              </h3>
              <p className="text-[#F5F5F0]/90">
                You may not misuse the service, attempt to gain unauthorized access, scrape data at scale, or use it for any illegal purpose. We may suspend or terminate access for violations.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Disclaimer
              </h3>
              <p className="text-[#F5F5F0]/90">
                MushroomRadar is provided as is. We are not liable for any decisions made based on our predictions. Foraging carries inherent risks; you are responsible for your own safety and compliance with laws.
              </p>
              <h3 className="text-lg font-medium text-[#F5F5F0] pt-2">
                Changes
              </h3>
              <p className="text-[#F5F5F0]/90">
                We may update these terms from time to time. Continued use after changes constitutes acceptance. Contact: legal@mushroomradar.example.
              </p>
            </article>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
