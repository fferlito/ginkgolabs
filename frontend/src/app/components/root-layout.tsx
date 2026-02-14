import { Outlet } from "react-router";
import { Navigation } from "./navigation";
import { Footer } from "./footer";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#0A0E0C] flex flex-col">
      <Navigation />
      <main className="pt-16 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}