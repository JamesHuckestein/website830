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
};

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

const officerTitles = [
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

export const officers: Officer[] = Array.from({ length: 14 }, (_, index) => {
  const title = officerTitles[index];
  if (index === 0) {
    return {
      name: "SK John H Akers",
      title,
      imageUrl: "/officers/john-h-akers.png",
    };
  }
  if (index === 1) {
    return {
      name: "SK James Huckestein",
      title,
      imageUrl: "/officers/james-h.png",
    };
  }
  if (index === 2) {
    return {
      name: "SK Dennis M Riley",
      title,
      imageUrl: "/officers/Riley.png",
    };
  }
  if (index === 3) {
    return {
      name: "SK Mark Radcliffe",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 4) {
    return {
      name: "SK John Grahek",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 5) {
    return {
      name: "SK John A. Manning",
      title,
      imageUrl: "/officers/Manning.png",
    };
  }
  if (index === 6) {
    return {
      name: "Michael W. Schindler",
      title,
      imageUrl: "/officers/Schindler.png",
    };
  }
  if (index === 7) {
    return {
      name: "Michael D. Gunnels",
      title,
      imageUrl: "/officers/Gunnels.png",
    };
  }
  if (index === 8) {
    return {
      name: "Michael D. Placeholder",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 9) {
    return {
      name: "Aaron Sheets",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 10) {
    return {
      name: "SK Gary Walton",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 11) {
    return {
      name: "SK Frank A. Ventura",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 12) {
    return {
      name: "Rob Steele",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
  if (index === 13) {
    return {
      name: "Jan Wojciechowski",
      title,
      imageUrl: "/officers/Ventura.png",
    };
  }
});

export const sectionContent: Record<
  Exclude<SectionId, "home" | "officers" | "members">,
  { title: string; body: string; links?: { label: string; href: string }[] }
> = {
  about: {
    title: "About Our Council",
    body: "Council 830 serves parish families through faith formation, charity drives, and community fellowship throughout the year.",
  },
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
