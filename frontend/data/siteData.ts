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

export type MemberProfile = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  birthday: string; // ISO date
  officerPosition: string | null;
  email: string;
  assemblyNumber: string | null;
  firstDegreeDate: string | null;
  secondDegreeDate: string | null;
  thirdDegreeDate: string | null;
  fourthDegreeDate: string | null;
};

export type PrayerRequest = {
  id: string;
  text: string;
  submittedBy: string;
  submittedAt: string; // ISO datetime
};

export type MeetingMinutesEntry = {
  id: string;
  title: string;
  meetingDate: string; // ISO date
  pdfPath: string;
};

export type MemberSubSection =
  | "contactInfo"
  | "birthdays"
  | "prayerRequests"
  | "memberList"
  | "officers"
  | "nomination"
  | "meetingMinutes";

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
  { name: "SK Mark Radcliffe",      title: "Advocate",            imageUrl: "/officers/Ventura.png",      email: "mark.radcliffe@koc830.org" },
  { name: "SK John Grahek",         title: "Recorder",            imageUrl: "/officers/Ventura.png",      email: "john.grahek@koc830.org" },
  { name: "SK John A. Manning",     title: "Treasurer",           imageUrl: "/officers/Manning.png",      email: "john.manning@koc830.org" },
  { name: "Michael W. Schindler",   title: "Warden",              imageUrl: "/officers/Schindler.png",    email: "michael.schindler@koc830.org" },
  { name: "Michael D. Gunnels",     title: "Inside Guard",        imageUrl: "/officers/Gunnels.png",      email: "michael.gunnels@koc830.org" },
  { name: "Michael D. Placeholder", title: "Outside Guard",       imageUrl: "/officers/Ventura.png",      email: "outside.guard@koc830.org" },
  { name: "Aaron Sheets",           title: "Trustee - 1 Year",   imageUrl: "/officers/Ventura.png",      email: "aaron.sheets@koc830.org" },
  { name: "SK Gary Walton",         title: "Trustee - 2 Year",   imageUrl: "/officers/Ventura.png",      email: "gary.walton@koc830.org" },
  { name: "SK Frank A. Ventura",    title: "Trustee - 3 Year",   imageUrl: "/officers/Ventura.png",      email: "frank.ventura@koc830.org" },
  { name: "Rob Steele",             title: "Financial Secretary", imageUrl: "/officers/Ventura.png",      email: "rob.steele@koc830.org" },
  { name: "Jan Wojciechowski",      title: "Lecturer",            imageUrl: "/officers/Ventura.png",      email: "jan.wojciechowski@koc830.org" },
];

export const dummyMembers: MemberProfile[] = [
  { memberNumber: "8301001", firstName: "James",   lastName: "Huckestein",  address: "123 Oak St, Denison, TX 75020",    phone: "903-555-0101", birthday: "1968-03-15", officerPosition: "Deputy Grand Knight", email: "james.huckestein@koc830.org",  assemblyNumber: "1234", firstDegreeDate: "1995-06-01", secondDegreeDate: "1995-07-15", thirdDegreeDate: "1995-09-10", fourthDegreeDate: "2000-04-22" },
  { memberNumber: "8301002", firstName: "John",    lastName: "Akers",       address: "456 Elm Ave, Denison, TX 75020",   phone: "903-555-0102", birthday: "1955-11-28", officerPosition: "Grand Knight",        email: "john.akers@koc830.org",        assemblyNumber: "1234", firstDegreeDate: "1980-03-10", secondDegreeDate: "1980-04-05", thirdDegreeDate: "1980-06-20", fourthDegreeDate: "1985-10-15" },
  { memberNumber: "8301003", firstName: "Dennis",  lastName: "Riley",       address: "789 Maple Dr, Denison, TX 75020",  phone: "903-555-0103", birthday: "1962-07-04", officerPosition: "Chancellor",          email: "dennis.riley@koc830.org",      assemblyNumber: null,   firstDegreeDate: "1990-05-12", secondDegreeDate: "1990-06-18", thirdDegreeDate: "1990-08-30", fourthDegreeDate: null },
  { memberNumber: "8301004", firstName: "Mark",    lastName: "Radcliffe",   address: "321 Pine Ln, Sherman, TX 75090",   phone: "903-555-0104", birthday: "1970-05-02", officerPosition: null,                  email: "mark.radcliffe@example.com",   assemblyNumber: null,   firstDegreeDate: "2005-09-14", secondDegreeDate: "2005-10-20", thirdDegreeDate: "2005-12-05", fourthDegreeDate: null },
  { memberNumber: "8301005", firstName: "John",    lastName: "Manning",     address: "654 Cedar Blvd, Denison, TX 75020",phone: "903-555-0105", birthday: "1958-09-19", officerPosition: "Treasurer",           email: "john.manning@koc830.org",      assemblyNumber: "1234", firstDegreeDate: "1985-02-28", secondDegreeDate: "1985-04-10", thirdDegreeDate: "1985-07-22", fourthDegreeDate: "1992-11-08" },
  { memberNumber: "8301006", firstName: "Michael", lastName: "Schindler",   address: "987 Birch Ct, Denison, TX 75021",  phone: "903-555-0106", birthday: "1975-12-25", officerPosition: null,                  email: "michael.schindler@example.com",assemblyNumber: null,   firstDegreeDate: "2010-11-03", secondDegreeDate: "2010-12-15", thirdDegreeDate: "2011-02-19", fourthDegreeDate: null },
  { memberNumber: "8301007", firstName: "Michael", lastName: "Gunnels",     address: "159 Walnut St, Sherman, TX 75092", phone: "903-555-0107", birthday: "1980-04-30", officerPosition: null,                  email: "michael.gunnels@example.com",  assemblyNumber: null,   firstDegreeDate: "2008-06-07", secondDegreeDate: "2008-07-21", thirdDegreeDate: "2008-09-15", fourthDegreeDate: null },
  { memberNumber: "8301008", firstName: "Aaron",   lastName: "Sheets",      address: "753 Spruce Ave, Denison, TX 75020",phone: "903-555-0108", birthday: "1985-08-11", officerPosition: null,                  email: "aaron.sheets@example.com",     assemblyNumber: null,   firstDegreeDate: "2015-03-22", secondDegreeDate: "2015-04-30", thirdDegreeDate: "2015-06-14", fourthDegreeDate: null },
  { memberNumber: "8301009", firstName: "Gary",    lastName: "Walton",      address: "246 Ash Rd, Denison, TX 75021",    phone: "903-555-0109", birthday: "1960-01-07", officerPosition: null,                  email: "gary.walton@example.com",      assemblyNumber: "1234", firstDegreeDate: "1988-08-17", secondDegreeDate: "1988-09-29", thirdDegreeDate: "1988-11-12", fourthDegreeDate: "1995-05-03" },
  { memberNumber: "8301010", firstName: "Frank",   lastName: "Ventura",     address: "864 Poplar Dr, Sherman, TX 75090", phone: "903-555-0110", birthday: "1952-06-18", officerPosition: null,                  email: "frank.ventura@example.com",    assemblyNumber: "1234", firstDegreeDate: "1975-01-25", secondDegreeDate: "1975-03-08", thirdDegreeDate: "1975-05-20", fourthDegreeDate: "1980-09-14" },
  { memberNumber: "8301011", firstName: "Rob",     lastName: "Steele",      address: "531 Hickory Ln, Denison, TX 75020",phone: "903-555-0111", birthday: "1978-02-14", officerPosition: null,                  email: "rob.steele@example.com",       assemblyNumber: null,   firstDegreeDate: "2003-07-09", secondDegreeDate: "2003-08-21", thirdDegreeDate: "2003-10-05", fourthDegreeDate: null },
  { memberNumber: "8301012", firstName: "Jan",     lastName: "Wojciechowski",address: "420 Willow Way, Denison, TX 75021",phone: "903-555-0112", birthday: "1965-10-31", officerPosition: null,                 email: "jan.wojciechowski@example.com",assemblyNumber: null,   firstDegreeDate: "1998-04-16", secondDegreeDate: "1998-05-28", thirdDegreeDate: "1998-07-10", fourthDegreeDate: null },
];

export const dummyPrayerRequests: PrayerRequest[] = [
  { id: "pr-001", text: "Please pray for the healing of Tom Brady, who is recovering from surgery.", submittedBy: "8301004", submittedAt: "2026-04-28T10:15:00Z" },
  { id: "pr-002", text: "Prayers requested for the Gonzalez family who lost their home in a fire.", submittedBy: "8301006", submittedAt: "2026-04-25T14:30:00Z" },
  { id: "pr-003", text: "Please keep Fr. Michael in your prayers as he begins his cancer treatment.", submittedBy: "8301002", submittedAt: "2026-04-20T09:00:00Z" },
  { id: "pr-004", text: "Prayers for safe travel for the youth group attending the diocesan retreat.", submittedBy: "8301008", submittedAt: "2026-04-15T16:45:00Z" },
  { id: "pr-005", text: "Please pray for the repose of the soul of SK Robert Henderson, who passed away peacefully.", submittedBy: "8301001", submittedAt: "2026-04-10T08:20:00Z" },
];

export const dummyMeetingMinutes: MeetingMinutesEntry[] = [
  { id: "mm-001", title: "Council Business Meeting - April 2026",   meetingDate: "2026-04-02", pdfPath: "/meeting-minutes/april-2026.pdf" },
  { id: "mm-002", title: "Council Business Meeting - March 2026",   meetingDate: "2026-03-05", pdfPath: "/meeting-minutes/march-2026.pdf" },
  { id: "mm-003", title: "Council Business Meeting - February 2026",meetingDate: "2026-02-05", pdfPath: "/meeting-minutes/february-2026.pdf" },
  { id: "mm-004", title: "Council Business Meeting - January 2026", meetingDate: "2026-01-08", pdfPath: "/meeting-minutes/january-2026.pdf" },
];

export const sectionContent: Record<
  Exclude<SectionId, "home" | "officers" | "members" | "about">,
  { title: string; body: string; links?: { label: string; href: string }[] }
> = {
  prayer: {
    title: "Prayer Requests",
    body: "Please keep our parish families, clergy, and first responders in your prayers. Contact the council office to submit intentions.",
  },
  events: {
    title: "Events Calendar",
    body: "Upcoming events include monthly meetings, parish breakfasts, and service projects. Dates and times are posted each month.",
  },
  news: {
    title: "News & Announcements",
    body: "Membership renewal packets are available now. Volunteers are needed for our spring charity dinner and youth outreach event.",
  },
  photos: {
    title: "Photo Galleries",
    body: "View highlights from council dinners, parish service days, and fraternity events as we continue to grow in faith and service.",
  },
  links: {
    title: "Links of Interest",
    body: "Explore trusted Catholic resources and local parish information.",
    links: [
      { label: "USCCB", href: "https://www.usccb.org/" },
      { label: "Vatican", href: "https://www.vatican.va/" },
      { label: "Local Diocese", href: "https://www.dioceseoftucson.org/" },
    ],
  },
  catholicism: {
    title: "Catholicism",
    body: "Learn more about the sacraments, Catholic teaching, and opportunities for spiritual growth in our parish and community.",
  },
  assembly: {
    title: "Assembly Sites",
    body: "Visit district assembly resources for fourth degree information.",
    links: [{ label: "District Assembly", href: "https://www.kofc.org/" }],
  },
  state: {
    title: "State Council Site",
    body: "See statewide announcements, programs, and forms.",
    links: [{ label: "Arizona State Council", href: "https://www.azkofc.org/" }],
  },
  supreme: {
    title: "Supreme Council Site",
    body: "Access official resources from the Knights of Columbus Supreme Council.",
    links: [{ label: "Supreme Council", href: "https://www.kofc.org/" }],
  },
};
