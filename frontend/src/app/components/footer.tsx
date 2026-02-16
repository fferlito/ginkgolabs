import { Link } from "react-router";
import { Instagram, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0F1812] border-t border-[#2D5F3F]/30">
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
            <Link to="/app/privacy" className="text-sm text-[#9CA89F] hover:text-[#4A7C5D] transition-colors">
              Privacy & Terms
            </Link>
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
