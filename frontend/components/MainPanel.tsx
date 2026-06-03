import { AnnouncementsUpdate } from "@/components/AnnouncementsUpdate";
import { BirthdayList } from "@/components/BirthdayList";
import { Calendar } from "@/components/Calendar";
import { CalendarUpdates } from "@/components/CalendarUpdates";
import { ContactInfoForm } from "@/components/ContactInfoForm";
import { HomeCarousel } from "@/components/HomeCarousel";
import { MeetingMinutes } from "@/components/MeetingMinutes";
import { MemberList } from "@/components/MemberList";
import { MembersArea } from "@/components/MembersArea";
import { MembersLoginForm } from "@/components/MembersLoginForm";
import { News } from "@/components/News";
import { NominationForm } from "@/components/NominationForm";
import { OfficerContacts } from "@/components/OfficerContacts";
import { OfficersGrid } from "@/components/OfficersGrid";
import { OfficersUpdate } from "@/components/OfficersUpdate";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PhotoGalleryUpdate } from "@/components/PhotoGalleryUpdate";
import { PrayerRequests } from "@/components/PrayerRequests";
import { PublicPrayerRequests } from "@/components/PublicPrayerRequests";
import {
  aboutCouncilDetails,
  officers,
  sectionContent,
  type MemberSubSection,
  type SectionId,
} from "@/data/siteData";

type MainPanelProps = {
  activeSection: SectionId;
  isLoggedIn: boolean;
  isOfficer: boolean;
  officerPosition: string | null;
  token: string | null;
  memberNumber: string | null;
  memberSubSection: MemberSubSection | null;
  meetingMinutesDetail: string | null;
  onLogin: (membershipNumber: string, passcode: string) => Promise<boolean>;
  onLogout: () => void;
  onNavigateToSection: (section: SectionId) => void;
  onSelectMemberSubSection: (sub: MemberSubSection) => void;
  onSelectMeetingMinute: (id: string) => void;
  onBackToMeetingMinutes: () => void;
  onBackToMembersArea: () => void;
};

export function MainPanel({
  activeSection,
  isLoggedIn,
  isOfficer,
  officerPosition,
  token,
  memberNumber,
  memberSubSection,
  meetingMinutesDetail,
  onLogin,
  onLogout,
  onNavigateToSection,
  onSelectMemberSubSection,
  onSelectMeetingMinute,
  onBackToMeetingMinutes,
  onBackToMembersArea,
}: MainPanelProps) {
  if (activeSection === "home") {
    return (
      <HomeCarousel
        officers={officers}
        onOpenOfficers={() => onNavigateToSection("officers")}
      />
    );
  }

  if (activeSection === "officers") {
    return <OfficersGrid />;
  }

  if (activeSection === "members") {
    if (!isLoggedIn) {
      return <MembersLoginForm onLogin={onLogin} />;
    }

    if (memberSubSection === "contactInfo") {
      return <ContactInfoForm token={token!} memberNumber={memberNumber!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "birthdays") {
      return <BirthdayList token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "prayerRequests") {
      return <PrayerRequests token={token!} memberNumber={memberNumber!} isOfficer={isOfficer} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "memberList") {
      return <MemberList token={token!} isOfficer={isOfficer} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "officers") {
      return <OfficerContacts token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "nomination") {
      return <NominationForm token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "meetingMinutes") {
      return (
        <MeetingMinutes
          token={token!}
          detailId={meetingMinutesDetail}
          onSelectMinute={onSelectMeetingMinute}
          onBackToList={onBackToMeetingMinutes}
          onBackToMembersArea={onBackToMembersArea}
        />
      );
    }
    if (memberSubSection === "calendarUpdates" && isOfficer) {
      return <CalendarUpdates token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "announcementsUpdate" && isOfficer) {
      return <AnnouncementsUpdate token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "editPhotoGallery" && isOfficer) {
      return <PhotoGalleryUpdate token={token!} onBack={onBackToMembersArea} />;
    }
    if (memberSubSection === "updateOfficers" && isOfficer) {
      return <OfficersUpdate token={token!} onBack={onBackToMembersArea} />;
    }

    return (
      <MembersArea
        isOfficer={isOfficer}
        officerPosition={officerPosition}
        onSelect={onSelectMemberSubSection}
        onLogout={onLogout}
      />
    );
  }

  if (activeSection === "about") {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#032147]">About Our Council</h2>
        <p className="text-[#888888]">Council 830 serves parish families through faith formation, charity drives, and community fellowship throughout the year.</p>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold tracking-wide text-[#032147]">
                {aboutCouncilDetails.meetingsHeading}
              </h3>
              <p className="text-sm leading-relaxed text-[#888888]">
                {aboutCouncilDetails.meetingsAddressLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold tracking-wide text-[#032147]">
                {aboutCouncilDetails.mailingHeading}
              </h3>
              <p className="text-sm leading-relaxed text-[#888888]">
                {aboutCouncilDetails.mailingAddressLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-[#032147]">
                {aboutCouncilDetails.scheduleHeading}
              </h3>
              <ul className="space-y-4">
                {aboutCouncilDetails.scheduleItems.map((item) => (
                  <li key={item.title} className="space-y-1">
                    <p className="text-sm font-semibold text-[#032147]">{item.title}</p>
                    <p className="text-sm leading-relaxed text-[#888888]">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-[#032147]">
              {aboutCouncilDetails.supportHeading}
            </h3>
            <ul className="space-y-5">
              {aboutCouncilDetails.supportOrganizations.map((org) => (
                <li key={org.name} className="space-y-2">
                  <p className="font-semibold text-[#032147]">{org.name}</p>
                  <p className="text-sm leading-relaxed text-[#888888]">
                    {org.addressLines.map((line, index) => (
                      <span key={line}>
                        {index > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </p>
                  <a
                    href={org.websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {org.websiteLabel}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  if (activeSection === "prayer") {
    return <PublicPrayerRequests />;
  }

  if (activeSection === "events") {
    return <Calendar />;
  }

  if (activeSection === "news") {
    return <News />;
  }

  if (activeSection === "photos") {
    return <PhotoGallery />;
  }

  const content = sectionContent[activeSection];
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">{content.title}</h2>
      <p className="text-[#888888]">{content.body}</p>
      {content.links ? (
        <div className="flex flex-wrap gap-3">
          {content.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
