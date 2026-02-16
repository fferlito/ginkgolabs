import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Cloud, Droplets, Trees } from "lucide-react";
import { Link } from "react-router";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Split Screen */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-10 md:pt-0 md:pb-0 md:h-screen">
        <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6 md:gap-8 h-full items-center w-full">
          {/* Left: Text Content */}
          <div className="space-y-4 md:space-y-6 z-10 order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-6xl tracking-tight text-[#F5F5F0] leading-tight">
              Scan the Forest.<br />
              Find the <span className="text-[#4A7C5D]">Gold</span>.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#9CA89F] max-w-lg">
              MushroomRadar combines weather patterns, forest data, and machine learning 
              to predict mushroom hotspots with incredible accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

          {/* Right: Split Image with ML Overlay */}
          <div className="relative h-[220px] sm:h-[320px] md:h-[600px] rounded-xl md:rounded-2xl overflow-hidden border border-[#2D5F3F]/30 order-1 md:order-2">
            {/* Forest Photo */}
            <div className="absolute inset-0 w-1/2">
              <img
                src="https://images.unsplash.com/photo-1760509867646-fea60ad26b91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZm9yZXN0JTIwbXVzaHJvb20lMjBmb3JhZ2luZ3xlbnwxfHx8fDE3NzEwNzc1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Forest foraging"
                className="w-full h-full object-cover"
              />
            </div>
            {/* ML Heatmap Overlay */}
            <div className="absolute inset-0 left-1/2">
              <div 
                className="w-full h-full bg-gradient-to-br from-[#2D5F3F] via-[#4A7C5D] to-[#1B3022] opacity-90"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 40%, rgba(212, 175, 55, 0.6) 0%, transparent 25%), 
                                   radial-gradient(circle at 70% 60%, rgba(74, 124, 93, 0.8) 0%, transparent 30%),
                                   radial-gradient(circle at 50% 80%, rgba(45, 95, 63, 0.5) 0%, transparent 20%)`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-1 md:space-y-2">
                    <div className="text-[#D4AF37] text-2xl sm:text-4xl md:text-5xl">89%</div>
                    <div className="text-[#F5F5F0] text-xs md:text-sm">Match Probability</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glassmorphic overlay label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 md:top-4 md:px-6 md:py-3 rounded-full backdrop-blur-md bg-[#0A0E0C]/60 border border-[#2D5F3F]/40">
              <span className="text-xs md:text-sm text-[#F5F5F0]">Real-Time ML Analysis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Science Behind the Radar */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-[#0A0E0C] to-[#0F1812]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 md:mb-16">
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
      <section className="py-12 md:py-24 bg-[#0A0E0C]">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            <h2 className="text-2xl sm:text-4xl md:text-5xl text-[#F5F5F0]">Ready to Find Your First Bounty?</h2>
            <p className="text-base md:text-xl text-[#9CA89F]">
              Join foragers using MushroomRadar to discover the best hunting spots
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 md:pt-4">
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