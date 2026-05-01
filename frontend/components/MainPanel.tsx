import Image from "next/image";

import { HomeCarousel } from "@/components/HomeCarousel";
import { MembersLoginForm } from "@/components/MembersLoginForm";
import {
  aboutCouncilDetails,
  officers,
  sectionContent,
  type SectionId,
} from "@/data/siteData";

type MainPanelProps = {
  activeSection: SectionId;
  isLoggedIn: boolean;
  onLogin: (membershipNumber: string, passcode: string) => boolean;
  onLogout: () => void;
  onNavigateToSection: (section: SectionId) => void;
};

export function MainPanel({
  activeSection,
  isLoggedIn,
  onLogin,
  onLogout,
  onNavigateToSection,
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
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">Officers</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {officers.map((officer) => (
            <li
              key={officer.title}
              className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white"
            >
              <div className="flex justify-center bg-[#F5F5F5] p-2">
                <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
                  <Image
                    src={officer.imageUrl}
                    alt={`${officer.name} - ${officer.title}`}
                    width={384}
                    height={512}
                    className="block h-36 w-auto max-w-full object-contain object-top"
                    sizes="(max-width: 640px) 42vw, 11rem"
                  />
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="font-semibold text-[#032147]">{officer.title}</p>
                <p className="text-sm text-[#888888]">{officer.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (activeSection === "members") {
    if (isLoggedIn) {
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#032147]">Members Area</h2>
          <p className="text-[#888888]">
            Welcome to the members-only section. Here you can review private
            council updates and volunteer schedules.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#032147]">
            <li>Monthly council meeting agenda</li>
            <li>Committee sign-up opportunities</li>
            <li>Internal volunteer contact list</li>
          </ul>
          <button
            type="button"
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
            onClick={onLogout}
          >
            Logout
          </button>
        </section>
      );
    }

    return <MembersLoginForm onLogin={onLogin} />;
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
