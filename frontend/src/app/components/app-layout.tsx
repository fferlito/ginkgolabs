import { Outlet } from "react-router";
import { Navigation } from "./navigation";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0E0C]">
      <Navigation />
      <main className="relative flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}
