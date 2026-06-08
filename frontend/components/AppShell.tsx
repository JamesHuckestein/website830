"use client";

import { useState } from "react";

import { MainPanel } from "@/components/MainPanel";
import { SidebarNav } from "@/components/SidebarNav";
import { TopBanner } from "@/components/TopBanner";
import { navItems, type MemberSubSection, type SectionId } from "@/data/siteData";
import { loginMember } from "@/lib/api";

function decodeJwtPayload(token: string): { sub: string; isOfficer: boolean; officerPosition: string | null; isAdmin: boolean } {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload)) as { sub: string; isOfficer: boolean; officerPosition: string | null; isAdmin: boolean };
}

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [officerPosition, setOfficerPosition] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [memberSubSection, setMemberSubSection] = useState<MemberSubSection | null>(null);
  const [meetingMinutesDetail, setMeetingMinutesDetail] = useState<string | null>(null);

  const handleLogin = async (membershipNumber: string, passcode: string): Promise<boolean> => {
    try {
      const { token: jwt } = await loginMember(membershipNumber, passcode);
      const { sub, isOfficer: officerFlag, officerPosition: position, isAdmin: adminFlag } = decodeJwtPayload(jwt);
      setToken(jwt);
      setMemberNumber(sub);
      setIsLoggedIn(true);
      setIsOfficer(officerFlag);
      setIsAdmin(adminFlag ?? false);
      setOfficerPosition(position);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsOfficer(false);
    setIsAdmin(false);
    setOfficerPosition(null);
    setToken(null);
    setMemberNumber(null);
    setMemberSubSection(null);
    setMeetingMinutesDetail(null);
  };

  const handleSelectSection = (section: SectionId) => {
    setActiveSection(section);
    setMemberSubSection(null);
    setMeetingMinutesDetail(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <TopBanner />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[18rem_1fr]">
        <SidebarNav
          items={navItems}
          activeSection={activeSection}
          onSelect={handleSelectSection}
        />
        <main className="rounded-lg border border-[#E7E7E7] bg-white p-6 shadow-sm">
          <MainPanel
            activeSection={activeSection}
            isLoggedIn={isLoggedIn}
            isOfficer={isOfficer}
            isAdmin={isAdmin}
            officerPosition={officerPosition}
            token={token}
            memberNumber={memberNumber}
            memberSubSection={memberSubSection}
            meetingMinutesDetail={meetingMinutesDetail}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onNavigateToSection={handleSelectSection}
            onSelectMemberSubSection={(sub) => {
              setMemberSubSection(sub);
              setMeetingMinutesDetail(null);
            }}
            onSelectMeetingMinute={(id) => setMeetingMinutesDetail(id)}
            onBackToMeetingMinutes={() => setMeetingMinutesDetail(null)}
            onBackToMembersArea={() => {
              setMemberSubSection(null);
              setMeetingMinutesDetail(null);
            }}
          />
        </main>
      </div>
    </div>
  );
}
