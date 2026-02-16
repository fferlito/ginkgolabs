import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Cloud, Droplets, Trees } from "lucide-react";
import { Link } from "react-router";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Split Screen */}
      <section className="relative min-h-0 md:min-h-screen flex items-center overflow-hidden pt-16 pb-6 md:pt-0 md:pb-0 md:h-screen">
        <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-4 md:gap-8 h-full items-center w-full py-4 md:py-0">
          {/* Left: Text Content */}
          <div className="space-y-3 md:space-y-6 z-10 order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-6xl tracking-tight text-[#F5F5F0] leading-tight">
              The Real-Time <span className="text-[#4A7C5D]">Mushroom</span> Forecast App
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#9CA89F] max-w-lg">
              MushroomRadar combines weather patterns, forest data, and machine learning 
              to predict mushroom hotspots with incredible accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#2D5F3F] hover:bg-[#4A7C5D] text-[#F5F5F0] text-base md:text-lg px-6 md:px-8">
                  Scan the Forest
                </Button>
              </Link>
              <Link to="/science" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#2D5F3F] text-[#4A7C5D] hover:bg-[#1B3022] text-base md:text-lg px-6 md:px-8">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: App image */}
          <div className="relative h-[200px] sm:h-[320px] md:h-[600px] rounded-xl md:rounded-2xl overflow-hidden border border-[#2D5F3F]/30 order-1 md:order-2">
            <img
              src="/assets/app.png"
              alt="MushroomRadar app"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Science Behind the Radar */}
      <section className="py-8 md:py-24 bg-gradient-to-b from-[#0A0E0C] to-[#0F1812]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 text-[#F5F5F0]">Science Behind the Radar</h2>
            <p className="text-base md:text-xl text-[#9CA89F] max-w-2xl mx-auto px-0">
              We analyze weather patterns, terrain, and forest conditions to predict where mushrooms will grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {/* Climate Data */}
            <Card className="p-5 md:p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center group hover:border-[#4A7C5D] transition-all">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2D5F3F]/30 flex items-center justify-center group-hover:bg-[#2D5F3F]/50 transition-all">
                <Cloud className="w-8 h-8 text-[#4A7C5D]" />
              </div>
              <h3 className="text-xl mb-3 text-[#F5F5F0]">Weather Patterns</h3>
              <p className="text-[#9CA89F] leading-relaxed">
                High-resolution rainfall, humidity, and temperature data to spot ideal growing conditions
              </p>
            </Card>

            {/* Forest & Terrain */}
            <Card className="p-5 md:p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center group hover:border-[#4A7C5D] transition-all">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2D5F3F]/30 flex items-center justify-center group-hover:bg-[#2D5F3F]/50 transition-all">
                <Trees className="w-8 h-8 text-[#4A7C5D]" />
              </div>
              <h3 className="text-xl mb-3 text-[#F5F5F0]">Forest Intelligence</h3>
              <p className="text-[#9CA89F] leading-relaxed">
                Tree types, canopy coverage, elevation, and soil composition mapped across regions
              </p>
            </Card>

            {/* Machine Learning */}
            <Card className="p-5 md:p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center group hover:border-[#4A7C5D] transition-all">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2D5F3F]/30 flex items-center justify-center group-hover:bg-[#2D5F3F]/50 transition-all">
                <Droplets className="w-8 h-8 text-[#4A7C5D]" />
              </div>
              <h3 className="text-xl mb-3 text-[#F5F5F0]">Smart Predictions</h3>
              <p className="text-[#9CA89F] leading-relaxed">
                AI trained on thousands of sightings learns exactly when and where mushrooms appear
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-24 bg-[#0A0E0C]">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-3 md:space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-5xl text-[#F5F5F0]">Ready to Find Your First Bounty?</h2>
            <p className="text-base md:text-xl text-[#9CA89F]">
              Join foragers using MushroomRadar to discover the best hunting spots
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center pt-1 md:pt-4">
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#2D5F3F] hover:bg-[#4A7C5D] text-[#F5F5F0] text-base md:text-lg px-6 md:px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/science" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#2D5F3F] text-[#4A7C5D] hover:bg-[#1B3022] text-base md:text-lg px-6 md:px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}