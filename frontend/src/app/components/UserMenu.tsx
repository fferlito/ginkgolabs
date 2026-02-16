import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useClerk, useUser } from "@clerk/clerk-react";

const menuItems = [
  { id: "account", label: "Account" },
  { id: "mushroompedia", label: "Mushroompedia" },
  { id: "privacy", label: "Privacy Policy & Terms of Use" },
] as const;

interface UserMenuUIProps {
  onLogout: () => void;
  onItemClick?: (id: string) => void;
  userName?: string | null;
  userInitials?: string;
}

function UserMenuUI({ onLogout, onItemClick, userName, userInitials = "?" }: UserMenuUIProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.right - 220,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleClick = (id: string) => {
    setOpen(false);
    if (id === "logout") {
      onLogout();
    } else {
      onItemClick?.(id);
    }
  };

  const initials = userInitials.toUpperCase().slice(0, 2);
  const displayName = userName ?? "User";

  const dropdown = open && (
    <div
      ref={menuRef}
      className="fixed min-w-[220px] rounded-xl border border-[#2D5F3F]/20 bg-black/80 py-4 shadow-xl backdrop-blur-sm"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 10000,
      }}
      role="menu"
    >
      {/* Profile section */}
      <div className="flex flex-col items-center px-4 pb-3">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#A0AEC0] text-sm font-medium">
          {initials}
        </div>
        <span className="text-sm font-semibold text-[#F5F5F0]">{displayName}</span>
      </div>

      <div className="my-1 h-px bg-[#2D5F3F]/30" />

      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => handleClick(item.id)}
          className="w-full px-4 py-2.5 text-left text-sm text-[#F5F5F0] hover:bg-white/5 transition-colors"
        >
          {item.label}
        </button>
      ))}

      <div className="my-1 h-px bg-[#2D5F3F]/30" />

      <button
        type="button"
        role="menuitem"
        onClick={() => handleClick("logout")}
        className="w-full px-4 py-2.5 text-left text-sm text-[#F5F5F0] hover:bg-white/5 transition-colors"
      >
        Log out
      </button>
    </div>
  );

  return (
    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#2D5F3F]/30 bg-[#0A0E0C]/90 shadow-md backdrop-blur transition-all hover:scale-105 hover:border-[#2D5F3F]"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <img
          src="/assets/user.png"
          alt=""
          className="h-6 w-6 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </button>

      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function UserMenu() {
  const navigate = useNavigate();

  const handleItemClick = (id: string) => {
    if (id === "account") navigate("/app/account");
    if (id === "mushroompedia") navigate("/app/mushroompedia");
    if (id === "privacy") navigate("/app/privacy");
  };

  if (hasClerkKey) {
    return <UserMenuWithClerk onItemClick={handleItemClick} />;
  }
  return (
    <UserMenuUI
      onLogout={() => navigate("/app", { replace: true })}
      onItemClick={handleItemClick}
    />
  );
}

function UserMenuWithClerk({ onItemClick }: { onItemClick?: (id: string) => void }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const userName = user?.firstName ?? user?.fullName ?? null;
  const initials =
    user?.firstName?.[0] && user?.lastName?.[0]
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "?";

  const handleLogout = () => {
    signOut().then(() => navigate("/app", { replace: true }));
  };

  return (
    <UserMenuUI
      onLogout={handleLogout}
      onItemClick={onItemClick}
      userName={userName}
      userInitials={initials}
    />
  );
}
