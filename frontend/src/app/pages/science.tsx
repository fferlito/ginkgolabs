import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Cloud, Droplets, Mountain, Trees, ThermometerSun, Wind } from "lucide-react";

export function SciencePage() {
  const dataLayers = [
    {
      name: "Rainfall & Humidity",
      icon: Droplets,
      description: "Track precipitation patterns and moisture levels that trigger mushroom growth",
      metrics: ["7-day rainfall history", "Current humidity %", "Soil saturation"],
      color: "#4A7C5D",
    },
    {
      name: "Temperature Tracking",
      icon: ThermometerSun,
      description: "Monitor temperature ranges perfect for different mushroom species",
      metrics: ["Daily temperature swings", "Ground temperature", "Frost predictions"],
      color: "#6B9A7C",
    },
    {
      name: "Forest Types & Terrain",
      icon: Trees,
      description: "Map forest composition, tree species, and elevation for targeted hunting",
      metrics: ["Deciduous vs coniferous", "Elevation zones", "Canopy density"],
      color: "#8FB89B",
    },
  ];

  const speciesGallery = [
    {
      name: "Boletus edulis",
      common: "Porcini",
      value: "€40-60/kg",
      season: "Sep-Nov",
      image: "https://images.unsplash.com/photo-1636887893497-3b13ea6f812d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3JjaW5pJTIwbXVzaHJvb20lMjBuYXR1cmV8ZW58MXx8fHwxNzcxMDc3NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rarity: "High Value",
    },
    {
      name: "Cantharellus cibarius",
      common: "Chanterelle",
      value: "€30-45/kg",
      season: "Jun-Oct",
      image: "https://images.unsplash.com/photo-1663922817736-a23798d29275?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFudGVyZWxsZSUyMG11c2hyb29tJTIwZm9yZXN0fGVufDF8fHx8MTc3MTA3NzUwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rarity: "Premium",
    },
    {
      name: "Morchella esculenta",
      common: "Morel",
      value: "€80-120/kg",
      season: "Apr-May",
      image: "https://images.unsplash.com/photo-1728130003656-b008581b7972?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3JlbCUyMG11c2hyb29tJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzEwNzc1MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rarity: "Ultra Rare",
    },
  ];

  return (
    <div className="min-h-screen py-24">
      {/* Header */}
      <section className="container mx-auto px-6 mb-16">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-5xl text-[#F5F5F0]">How It Works</h1>
          <p className="text-xl text-[#9CA89F]">
            We combine real-time weather data, forest intelligence, and machine learning 
            to predict exactly when and where mushrooms will appear
          </p>
        </div>
      </section>

      {/* Interactive Map Visualization */}
      <section className="container mx-auto px-6 mb-24">
        <Card className="p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Cloud className="w-6 h-6 text-[#4A7C5D]" />
            <h2 className="text-2xl text-[#F5F5F0]">Integrated Climate Intelligence</h2>
          </div>
          
          {/* Map Visualization */}
          <div className="relative h-[500px] rounded-lg overflow-hidden border border-[#2D5F3F]/30 bg-[#0A0E0C]">
            {/* Base forest image */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1761415452185-0610b7a844d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBmb3Jlc3QlMjB2aWV3fGVufDF8fHx8MTc3MTA3NzUwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E0C]/60 to-[#1B3022]/80" />
            </div>

            {/* Heatmap probability zones */}
            <div className="absolute inset-0">
              {[
                { x: '25%', y: '30%', intensity: 0.9, label: '89%' },
                { x: '60%', y: '45%', intensity: 0.7, label: '72%' },
                { x: '40%', y: '70%', intensity: 0.85, label: '85%' },
                { x: '75%', y: '25%', intensity: 0.6, label: '64%' },
              ].map((point, idx) => (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    left: point.x,
                    top: point.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="w-32 h-32 rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle, rgba(212, 175, 55, ${point.intensity}) 0%, transparent 70%)`,
                      animation: `pulse ${2 + idx * 0.5}s ease-in-out infinite`,
                    }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F5F5F0] font-bold">
                    {point.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Glassmorphic info overlays */}
            <div className="absolute top-6 left-6 right-6 grid grid-cols-3 gap-3">
              <div className="px-4 py-3 rounded-lg backdrop-blur-md bg-[#0A0E0C]/70 border border-[#2D5F3F]/40">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-[#4A7C5D]" />
                  <div className="text-xs text-[#9CA89F]">Rainfall (7d)</div>
                </div>
                <div className="text-sm text-[#4A7C5D]">42mm • High</div>
              </div>
              <div className="px-4 py-3 rounded-lg backdrop-blur-md bg-[#0A0E0C]/70 border border-[#2D5F3F]/40">
                <div className="flex items-center gap-2 mb-1">
                  <ThermometerSun className="w-4 h-4 text-[#4A7C5D]" />
                  <div className="text-xs text-[#9CA89F]">Temperature</div>
                </div>
                <div className="text-sm text-[#4A7C5D]">18-22°C • Ideal</div>
              </div>
              <div className="px-4 py-3 rounded-lg backdrop-blur-md bg-[#0A0E0C]/70 border border-[#2D5F3F]/40">
                <div className="flex items-center gap-2 mb-1">
                  <Mountain className="w-4 h-4 text-[#4A7C5D]" />
                  <div className="text-xs text-[#9CA89F]">Elevation</div>
                </div>
                <div className="text-sm text-[#4A7C5D]">800-1200m</div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 px-4 py-3 rounded-lg backdrop-blur-md bg-[#0A0E0C]/70 border border-[#2D5F3F]/40">
              <div className="text-xs text-[#9CA89F] mb-2">Probability Zones</div>
              <div className="flex gap-3">
                {[
                  { label: "Low", color: "#2D5F3F" },
                  { label: "Medium", color: "#4A7C5D" },
                  { label: "High", color: "#D4AF37" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-[#9CA89F]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* How Our System Works */}
      <section className="container mx-auto px-6 mb-24">
        <h2 className="text-3xl text-[#F5F5F0] mb-4 text-center">What We Track</h2>
        <p className="text-center text-[#9CA89F] mb-12 max-w-2xl mx-auto">
          Our system monitors dozens of environmental factors and learns from thousands of verified mushroom sightings
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {dataLayers.map((layer, idx) => (
            <Card key={idx} className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
              <div 
                className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${layer.color}30` }}
              >
                <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
              </div>
              <h3 className="text-xl mb-2 text-[#F5F5F0]">{layer.name}</h3>
              <p className="text-sm text-[#9CA89F] mb-4">{layer.description}</p>
              <div className="space-y-2">
                {layer.metrics.map((metric, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: layer.color }} />
                    <span className="text-sm text-[#9CA89F]">{metric}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Data Points */}
      <section className="container mx-auto px-6 mb-24">
        <Card className="p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
          <h3 className="text-2xl text-[#F5F5F0] mb-6">Plus Many More Data Points</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm uppercase tracking-wider text-[#4A7C5D] mb-4">Environmental</h4>
              <div className="space-y-2">
                {[
                  "Wind speed and direction",
                  "Barometric pressure changes",
                  "UV index and sun exposure",
                  "Historical weather patterns",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C5D]" />
                    <span className="text-[#9CA89F]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm uppercase tracking-wider text-[#4A7C5D] mb-4">Terrain & Forest</h4>
              <div className="space-y-2">
                {[
                  "Soil pH and composition",
                  "North/south facing slopes",
                  "Proximity to water sources",
                  "Tree age and density",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C5D]" />
                    <span className="text-[#9CA89F]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Species Gallery */}
      <section className="container mx-auto px-6 pb-24">
        <div className="mb-8">
          <h2 className="text-3xl text-[#F5F5F0] mb-2">Species We Track</h2>
          <p className="text-[#9CA89F]">Premium mushroom varieties with the highest market value</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {speciesGallery.map((species, idx) => (
            <Card key={idx} className="overflow-hidden bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm group hover:border-[#4A7C5D] transition-all">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={species.image} 
                  alt={species.common}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#D4AF37] text-[#0A0E0C]">{species.rarity}</Badge>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-xl text-[#F5F5F0] mb-1">{species.common}</h3>
                  <p className="text-sm italic text-[#9CA89F]">{species.name}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#2D5F3F]/30">
                  <div>
                    <div className="text-xs text-[#9CA89F]">Market Value</div>
                    <div className="text-lg text-[#4A7C5D]">{species.value}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA89F]">Peak Season</div>
                    <div className="text-sm text-[#F5F5F0]">{species.season}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
