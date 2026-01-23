"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Navbar, SidebarProvider } from "./Navbar";

const FULL_SCREEN_ROUTES = ["/play/", "/onboarding", "/login", "/signup"];
// Dashboard/app routes should not show the footer
const NO_FOOTER_ROUTES = ["/lunchtable", "/binder", "/profile", "/quests", "/decks", "/shop"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide navbar/footer on full-screen routes (game screens, onboarding, auth pages)
  const isFullScreen =
    FULL_SCREEN_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname === "/onboarding" ||
    pathname === "/login" ||
    pathname === "/signup";

  // Hide only footer on certain routes (keeps navbar)
  const hideFooter = NO_FOOTER_ROUTES.some((route) => pathname.startsWith(route));

  if (isFullScreen) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </SidebarProvider>
  );
}
