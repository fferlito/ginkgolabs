import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { 
  Layers, 
  MapPin, 
  Eye, 
  EyeOff, 
  Calendar,
  Filter,
  Info,
  Lock
} from "lucide-react";

export function DashboardPage() {
  const [timeSlider, setTimeSlider] = useState([3]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(["porcini", "chanterelle"]);
  const [layers, setLayers] = useState({
    ndvi: true,
    moisture: true,
    probability: true,
    sightings: true,
  });

  const speciesList = [
    { id: "porcini", name: "Boletus edulis", common: "Porcini", color: "#D4AF37" },
    { id: "chanterelle", name: "Cantharellus", common: "Chanterelle", color: "#FFA500" },
    { id: "morel", name: "Morchella", common: "Morel", color: "#FFD700" },
    { id: "truffle", name: "Tuber", common: "Truffle", color: "#8B4513", premium: true },
  ];

  const recentSightings = [
    { species: "Porcini", location: "Black Forest", time: "2h ago", verified: true, premium: false },
    { species: "Chanterelle", location: "Vosges", time: "4h ago", verified: true, premium: false },
    { species: "Morel", location: "Alps", time: "6h ago", verified: false, premium: true },
    { species: "Truffle", location: "Piedmont", time: "8h ago", verified: true, premium: true },
    { species: "Porcini", location: "Carpathians", time: "12h ago", verified: true, premium: false },
  ];

  const toggleSpecies = (id: string) => {
    setSelectedSpecies(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0A0E0C]">
      <div className="flex-1 flex">
        {/* Left Sidebar - Species Selection */}
        <div className="w-80 border-r border-[#2D5F3F]/30 bg-[#0F1812] flex flex-col">
          <div className="p-6 border-b border-[#2D5F3F]/30">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-[#4A7C5D]" />
              <h2 className="text-lg text-[#F5F5F0]">Species Selection</h2>
            </div>
            <p className="text-sm text-[#9CA89F]">Toggle species to show on radar</p>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-3">
              {speciesList.map((species) => (
                <Card
                  key={species.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedSpecies.includes(species.id)
                      ? "bg-[#2D5F3F]/30 border-[#4A7C5D]"
                      : "bg-[#1B3022]/40 border-[#2D5F3F]/30"
                  }`}
                  onClick={() => !species.premium && toggleSpecies(species.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: species.color }}
                        />
                        <h3 className="text-sm text-[#F5F5F0]">{species.common}</h3>
                        {species.premium && (
                          <Lock className="w-3 h-3 text-[#D4AF37]" />
                        )}
                      </div>
                      <p className="text-xs italic text-[#9CA89F]">{species.name}</p>
                    </div>
                    {!species.premium && (
                      <div className={`w-5 h-5 rounded border ${
                        selectedSpecies.includes(species.id)
                          ? "bg-[#4A7C5D] border-[#4A7C5D]"
                          : "border-[#2D5F3F]"
                      }`} />
                    )}
                  </div>
                  {species.premium && (
                    <Badge className="mt-2 bg-[#D4AF37] text-[#0A0E0C] text-xs">
                      Pro Only
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Layer Toggles */}
          <div className="p-6 border-t border-[#2D5F3F]/30">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#4A7C5D]" />
              <h3 className="text-sm text-[#F5F5F0]">Data Layers</h3>
            </div>
            <div className="space-y-3">
              {[
                { id: "ndvi", label: "NDVI Index" },
                { id: "moisture", label: "Soil Moisture" },
                { id: "probability", label: "Probability Heat" },
                { id: "sightings", label: "User Sightings" },
              ].map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#9CA89F]">{layer.label}</span>
                  <Switch
                    checked={layers[layer.id as keyof typeof layers]}
                    onCheckedChange={(checked) => 
                      setLayers(prev => ({ ...prev, [layer.id]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          {/* Map with glassmorphic overlays */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1761415452185-0610b7a844d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBmb3Jlc3QlMjB2aWV3fGVufDF8fHx8MTc3MTA3NzUwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-[#0A0E0C]/40" />
          </div>

          {/* Probability heatmap overlays */}
          <div className="absolute inset-0">
            {selectedSpecies.includes("porcini") && (
              <>
                <div
                  className="absolute w-40 h-40 rounded-full animate-pulse"
                  style={{
                    left: '30%',
                    top: '35%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                <div
                  className="absolute w-32 h-32 rounded-full animate-pulse"
                  style={{
                    left: '70%',
                    top: '55%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.5) 0%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                    animationDelay: '1s',
                  }}
                />
              </>
            )}
            {selectedSpecies.includes("chanterelle") && (
              <div
                className="absolute w-36 h-36 rounded-full animate-pulse"
                style={{
                  left: '55%',
                  top: '28%',
                  background: 'radial-gradient(circle, rgba(255, 165, 0, 0.5) 0%, transparent 70%)',
                  transform: 'translate(-50%, -50%)',
                  animationDelay: '0.5s',
                }}
              />
            )}
          </div>

          {/* Glassmorphic info cards on map */}
          <div className="absolute top-6 left-6 right-6 flex gap-4">
            <Card className="px-6 py-4 backdrop-blur-md bg-[#0A0E0C]/70 border-[#2D5F3F]/40 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA89F] mb-1">Current Region</div>
                  <div className="text-lg text-[#F5F5F0]">Black Forest, Germany</div>
                </div>
                <MapPin className="w-6 h-6 text-[#4A7C5D]" />
              </div>
            </Card>
            <Card className="px-6 py-4 backdrop-blur-md bg-[#0A0E0C]/70 border-[#2D5F3F]/40 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA89F] mb-1">Peak Probability</div>
                  <div className="text-lg text-[#D4AF37]">89% • Porcini</div>
                </div>
                <div className="text-3xl">🍄</div>
              </div>
            </Card>
            <Card className="px-6 py-4 backdrop-blur-md bg-[#0A0E0C]/70 border-[#2D5F3F]/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#9CA89F] mb-1">Weather</div>
                  <div className="text-sm text-[#F5F5F0]">18°C • Humid</div>
                </div>
                <div className="text-2xl">🌧️</div>
              </div>
            </Card>
          </div>

          {/* Legend */}
          <Card className="absolute bottom-24 left-6 px-6 py-4 backdrop-blur-md bg-[#0A0E0C]/70 border-[#2D5F3F]/40">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#4A7C5D]" />
              <span className="text-sm text-[#F5F5F0]">Probability Legend</span>
            </div>
            <div className="flex gap-4">
              {[
                { label: "Low", color: "#2D5F3F" },
                { label: "Medium", color: "#4A7C5D" },
                { label: "High", color: "#D4AF37" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-[#9CA89F]">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Recent Sightings */}
        <div className="w-80 border-l border-[#2D5F3F]/30 bg-[#0F1812] flex flex-col">
          <div className="p-6 border-b border-[#2D5F3F]/30">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#4A7C5D]" />
              <h2 className="text-lg text-[#F5F5F0]">Recent Sightings</h2>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {recentSightings.map((sighting, idx) => (
                <Card
                  key={idx}
                  className="p-4 bg-[#1B3022]/40 border-[#2D5F3F]/30 relative overflow-hidden"
                >
                  {sighting.premium && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-[#0A0E0C]/60 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                        <p className="text-xs text-[#9CA89F]">Pro Plan Required</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm text-[#F5F5F0]">{sighting.species}</h4>
                      <p className="text-xs text-[#9CA89F]">{sighting.location}</p>
                    </div>
                    {sighting.verified && !sighting.premium && (
                      <Badge className="bg-[#2D5F3F] text-[#F5F5F0] text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9CA89F]">{sighting.time}</span>
                    {!sighting.premium && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-[#4A7C5D]">
                        View
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Time Travel Slider */}
      <div className="border-t border-[#2D5F3F]/30 bg-[#0F1812] p-6">
        <div className="container mx-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4A7C5D]" />
              <span className="text-sm text-[#F5F5F0]">7-Day Forecast</span>
            </div>
            
            <div className="flex-1">
              <Slider
                value={timeSlider}
                onValueChange={setTimeSlider}
                max={6}
                step={1}
                className="w-full"
              />
            </div>

            <div className="min-w-[120px] text-right">
              <div className="text-xs text-[#9CA89F]">Viewing</div>
              <div className="text-sm text-[#F5F5F0]">
                {timeSlider[0] === 0 ? "Today" : `+${timeSlider[0]} Days`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
