export type SectionId =
  | "home"
  | "about"
  | "officers"
  | "prayer"
  | "events"
  | "news"
  | "photos"
  | "links"
  | "catholicism"
  | "members"
  | "assembly"
  | "state"
  | "supreme";

export type NavItem = {
  id: SectionId;
  label: string;
};

export type Officer = {
  name: string;
  title: string;
  imageUrl: string;
  email?: string;
};

export type MemberSubSection =
  | "contactInfo"
  | "birthdays"
  | "prayerRequests"
  | "memberList"
  | "officers"
  | "nomination"
  | "meetingMinutes"
  | "calendarUpdates"
  | "announcementsUpdate"
  | "editPhotoGallery"
  | "updateOfficers"
  | "changePassword"
  | "adminPassword";

export const OFFICER_TITLES = [
  "Grand Knight",
  "Deputy Grand Knight",
  "Chancellor",
  "Advocate",
  "Recorder",
  "Treasurer",
  "Warden",
  "Inside Guard",
  "Outside Guard",
  "Trustee - 1 Year",
  "Trustee - 2 Year",
  "Trustee - 3 Year",
  "Financial Secretary",
  "Lecturer",
] as const;

export type OfficerTitle = (typeof OFFICER_TITLES)[number];

export const PRIVILEGED_OFFICER_TITLES = new Set([
  "Grand Knight",
  "Deputy Grand Knight",
  "Recorder",
  "Financial Secretary",
]);

export function isOfficerTitle(title: string | null): title is OfficerTitle {
  return OFFICER_TITLES.includes(title as OfficerTitle);
}

export const councilInfo = {
  name: "Knights of Columbus Council 830",
  addressLines: ["2027 S. Austin Avenue", "Denison, TX 75020 US"] as const,
  phone: "972-977-4766",
};

export const aboutCouncilDetails = {
  meetingsHeading: "COUNCIL MEETINGS LOCATION",
  meetingsAddressLines: councilInfo.addressLines,
  mailingHeading: "COUNCIL MAILING ADDRESS",
  mailingAddressLines: ["P. O. Box 351", "Denison, TX 75021-0351 US"] as const,
  scheduleHeading: "MEETING SCHEDULE & LOCATION",
  scheduleItems: [
    {
      title: "Council Business Meeting Schedule",
      detail: "1st Wednesday of the month at 6:30 PM",
    },
    {
      title: "Council Officers Meeting Schedule",
      detail: "Last Wednesday of the month at 7:00 PM",
    },
  ] as const,
  supportHeading: "IN SUPPORT OF:",
  supportOrganizations: [
    {
      name: "St. Patrick Catholic Church",
      addressLines: ["314 N. Rusk Avenue", "Denison, TX 75020 US"] as const,
      websiteLabel: "To Website",
      websiteHref: "https://saintpats.net/",
    },
    {
      name: "Saint Michael and All Angels Catholic Church",
      addressLines: ["101 E. Texas St.", "Denison, TX 75020 US"] as const,
      websiteLabel: "To Website",
      websiteHref: "https://www.stmichaelsallangels.com/",
    },
  ],
} as const;

export const navItems: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Our Council" },
  { id: "officers", label: "Officers" },
  { id: "prayer", label: "Prayer Requests" },
  { id: "events", label: "Events Calendar" },
  { id: "news", label: "News & Announcements" },
  { id: "photos", label: "Photo Galleries" },
  { id: "links", label: "Links of Interest" },
  { id: "catholicism", label: "Catholicism" },
  { id: "members", label: "Members Login" },
  { id: "assembly", label: "Assembly Sites" },
  { id: "state", label: "State Council Site" },
  { id: "supreme", label: "Supreme Council Site" },
];

export const officers: Officer[] = [
  { name: "SK John H Akers",        title: "Grand Knight",        imageUrl: "/officers/john-h-akers.png", email: "john.akers@koc830.org" },
  { name: "SK James Huckestein",    title: "Deputy Grand Knight", imageUrl: "/officers/james-h.png",      email: "james.huckestein@koc830.org" },
  { name: "SK Dennis M Riley",      title: "Chancellor",          imageUrl: "/officers/Riley.png",        email: "dennis.riley@koc830.org" },
  { name: "SK Mark Radcliffe",      title: "Advocate",            imageUrl: "/officers/Radcliffe.png",      email: "mark.radcliffe@koc830.org" },
  { name: "SK John Grahek",         title: "Recorder",            imageUrl: "/officers/Grahek.png",      email: "john.grahek@koc830.org" },
  { name: "SK John A. Manning",     title: "Treasurer",           imageUrl: "/officers/Manning.png",      email: "john.manning@koc830.org" },
  { name: "Michael W. Schindler",   title: "Warden",              imageUrl: "/officers/Schindler.png",    email: "michael.schindler@koc830.org" },
  { name: "Michael D. Gunnels",     title: "Inside Guard",        imageUrl: "/officers/Gunnels.png",      email: "michael.gunnels@koc830.org" },
  { name: "Vacant",                  title: "Outside Guard",       imageUrl: "/officers/placeholder.png",  email: "" },
  { name: "Aaron Sheets",           title: "Trustee - 1 Year",   imageUrl: "/officers/Sheets.png",      email: "aaron.sheets@koc830.org" },
  { name: "SK Gary Walton",         title: "Trustee - 2 Year",   imageUrl: "/officers/Ventura.png",      email: "gary.walton@koc830.org" },
  { name: "SK Frank A. Ventura",    title: "Trustee - 3 Year",   imageUrl: "/officers/Ventura.png",      email: "frank.ventura@koc830.org" },
  { name: "Rob Steele",             title: "Financial Secretary", imageUrl: "/officers/Steele.png",      email: "rob.steele@koc830.org" },
  { name: "Philip Kay",              title: "Lecturer",            imageUrl: "/officers/PhilKay.png",      email: "phil@philkay.com" },
];

export const sectionContent: Record<
  Exclude<SectionId, "home" | "officers" | "members" | "about" | "events" | "news" | "photos">,
  { title: string; body: string; links?: { label: string; href: string }[] }
> = {
  prayer: {
    title: "Prayer Requests",
    body: "Please keep our parish families, clergy, and first responders in your prayers. Contact the council office to submit intentions.",
  },
  links: {
    title: "Links of Interest",
    body: "Explore trusted Catholic resources and local parish information.",
    links: [
      { label: "USCCB", href: "https://www.usccb.org/" },
      { label: "Vatican", href: "https://www.vatican.va/" },
      { label: "Local Diocese", href: "https://dallascatholic.org/" },
    ],
  },
  catholicism: {
    title: "Catholicism",
    body: "Learn more about the sacraments, Catholic teaching, and opportunities for spiritual growth in our parish and community.",
  },
  assembly: {
    title: "Assembly Sites",
    body: "Visit district assembly resources for fourth degree information.",
    links: [{ label: "Assembly 1601", href: "https://uknight.org/Assembly.asp?A=1601" }],
  },
  state: {
    title: "State Council Site",
    body: "See statewide announcements, programs, and forms.",
    links: [{ label: "Texas State Council", href: "https://tkofc.org/" }],
  },
  supreme: {
    title: "Supreme Council Site",
    body: "Access official resources from the Knights of Columbus Supreme Council.",
    links: [{ label: "Supreme Council", href: "https://www.kofc.org/" }],
  },
};
