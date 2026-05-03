"use client";

import { useState } from "react";

import { MainPanel } from "@/components/MainPanel";
import { SidebarNav } from "@/components/SidebarNav";
import { TopBanner } from "@/components/TopBanner";
import { isOfficerTitle, navItems, type MemberSubSection, type SectionId } from "@/data/siteData";
import { authenticateMember } from "@/lib/auth";

export function AppShell() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [memberSubSection, setMemberSubSection] = useState<MemberSubSection | null>(null);
  const [meetingMinutesDetail, setMeetingMinutesDetail] = useState<string | null>(null);

  const handleLogin = (membershipNumber: string, passcode: string): boolean => {
    const result = authenticateMember(membershipNumber, passcode);
    if (result.success) {
      setIsLoggedIn(true);
      setIsOfficer(isOfficerTitle(result.officerPosition));
    }
    return result.success;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsOfficer(false);
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
