import { Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { Radar } from "lucide-react";
import { UserMenu } from "./UserMenu";

export function Navigation() {
  const location = useLocation();
  const isAppView = location.pathname.startsWith("/app");

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/science", label: "Science" },
    { path: "/pricing", label: "Pricing" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#2D5F3F]">
              <Radar className="w-6 h-6 text-[#F5F5F0]" />
            </div>
            <span className="text-xl tracking-tight text-[#F5F5F0]">
              Mushroom<span className="text-[#4A7C5D]">Radar</span>
            </span>
          </Link>

          {!isAppView && (
            <>
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm transition-colors ${
                      location.pathname === link.path
                        ? "text-[#4A7C5D]"
                        : "text-[#9CA89F] hover:text-[#F5F5F0]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Go to app */}
              <Link to="/app/dashboard">
                <Button className="bg-[#2D5F3F] hover:bg-[#4A7C5D] text-[#F5F5F0]">
                  Go to app
                </Button>
              </Link>
            </>
          )}
          {isAppView && <UserMenu />}
        </div>
      </div>
    </nav>
  );
}