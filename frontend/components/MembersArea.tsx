import type { MemberSubSection } from "@/data/siteData";

type MembersAreaProps = {
  isOfficer: boolean;
  onSelect: (sub: MemberSubSection) => void;
  onLogout: () => void;
};

const links: { id: MemberSubSection; label: string }[] = [
  { id: "contactInfo",     label: "Contact Information" },
  { id: "birthdays",       label: "Birthdays" },
  { id: "prayerRequests",  label: "Prayer Requests" },
  { id: "memberList",      label: "Member List" },
  { id: "officers",        label: "Officers" },
  { id: "nomination",      label: "Knight and Family of the Month" },
  { id: "meetingMinutes",  label: "Meeting Minutes" },
];

export function MembersArea({ isOfficer: _isOfficer, onSelect, onLogout }: MembersAreaProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#032147]">Members Area</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <button
              type="button"
              onClick={() => onSelect(link.id)}
              className="w-full rounded-md border border-[#BFA149] px-4 py-2 text-left text-sm font-medium text-[#032147] hover:bg-[#F6F0DF]"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
      >
        Logout
      </button>
    </section>
  );
}
