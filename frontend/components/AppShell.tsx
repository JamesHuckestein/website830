"use client";

import { useState } from "react";

import { MainPanel } from "@/components/MainPanel";
import { SidebarNav } from "@/components/SidebarNav";
import { TopBanner } from "@/components/TopBanner";
import { navItems, type SectionId } from "@/data/siteData";
import { authenticateMember } from "@/lib/auth";

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (membershipNumber: string, passcode: string) => {
    const valid = authenticateMember(membershipNumber, passcode);
    setIsLoggedIn(valid);
    return valid;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <TopBanner />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[18rem_1fr]">
        <SidebarNav
          items={navItems}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />
        <main className="rounded-lg border border-[#E7E7E7] bg-white p-6 shadow-sm">
          <MainPanel
            activeSection={activeSection}
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            onLogout={() => setIsLoggedIn(false)}
            onNavigateToSection={setActiveSection}
          />
        </main>
      </div>
    </div>
  );
}
