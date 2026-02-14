import { Link } from "react-router";
import { Card } from "./ui/card";
import { AlertTriangle, Instagram, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0F1812] border-t border-[#2D5F3F]/30">
      {/* Legal & Safety Disclaimer Banner */}
      <div className="container mx-auto px-6 py-8">
        <Card className="p-6 bg-[#5C4A3A]/20 border-[#D4AF37]/40 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-[#D4AF37]/20 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg text-[#F5F5F0] mb-2">Legal & Safety Disclaimer</h3>
              <p className="text-sm text-[#9CA89F] leading-relaxed">
                <strong className="text-[#F5F5F0]">IMPORTANT:</strong> MushroomRadar is a predictive tool for experienced foragers. 
                NEVER consume any mushroom unless positively identified by a qualified mycologist. 
                Many species have toxic look-alikes. MushroomRadar accepts NO liability for misidentification or consumption. 
                Users are responsible for complying with all local foraging laws and regulations.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Links and Social */}
      <div className="container mx-auto px-6 py-8 border-t border-[#2D5F3F]/30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-[#F5F5F0]">
              Mushroom<span className="text-[#4A7C5D]">Radar</span>
            </span>
            <span className="text-sm text-[#9CA89F]">© 2026</span>
          </div>

          {/* Quick Links */}
          <div className="flex gap-6">
            <Link to="/contact" className="text-sm text-[#9CA89F] hover:text-[#4A7C5D] transition-colors flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Contact
            </Link>
            <a href="#" className="text-sm text-[#9CA89F] hover:text-[#4A7C5D] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-[#9CA89F] hover:text-[#4A7C5D] transition-colors">
              Terms of Service
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#1B3022] hover:bg-[#2D5F3F] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-[#9CA89F] hover:text-[#F5F5F0]" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#1B3022] hover:bg-[#2D5F3F] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-[#9CA89F] hover:text-[#F5F5F0]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
