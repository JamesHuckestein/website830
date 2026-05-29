const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type MemberResponse = {
  memberNumber: string;
  firstName: string;
  lastName: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  phone: string;
  birthday: string;
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
  submittedAt: string;
};

export type PublicPrayerRequest = {
  id: string;
  text: string;
  submittedAt: string;
};

export type MeetingMinutesSummary = {
  id: string;
  title: string;
  meetingDate: string;
  s3Key: string;
};

export type MeetingMinutesDetail = {
  id: string;
  title: string;
  meetingDate: string;
  url: string;
};

export type Event = {
  id: string;
  day: string;
  title: string;
  description: string;
  timeOfDay: string | null;
  location: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  details: string;
  deleteDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // non-JSON error body — fall through to generic message
    }
    throw new Error(detail || `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function loginMember(membershipNumber: string, passcode: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membershipNumber, passcode }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json() as Promise<{ token: string }>;
}

export async function getMembers(token: string): Promise<MemberResponse[]> {
  return apiFetch<MemberResponse[]>("/members", token);
}

export async function getMember(token: string, memberNumber: string): Promise<MemberResponse> {
  return apiFetch<MemberResponse>(`/members/${memberNumber}`, token);
}

export async function updateMember(
  token: string,
  memberNumber: string,
  body: { addressStreet: string; addressCity: string; addressState: string; addressZip: string; phone: string; email: string }
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/members/${memberNumber}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getBirthdays(token: string): Promise<MemberResponse[]> {
  return apiFetch<MemberResponse[]>("/members/birthdays", token);
}

export async function exportMembersCSV(token: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/members/export-csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function getPrayerRequests(token: string): Promise<PrayerRequest[]> {
  return apiFetch<PrayerRequest[]>("/prayer-requests", token);
}

export async function createPrayerRequest(token: string, text: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/prayer-requests", token, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deletePrayerRequest(token: string, id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/prayer-requests/${id}`, token, {
    method: "DELETE",
  });
}

export async function getPublicPrayerRequests(): Promise<PublicPrayerRequest[]> {
  const res = await fetch(`${API_BASE}/prayer-requests/public`);
  if (!res.ok) throw new Error(`API ${res.status}: /prayer-requests/public`);
  return res.json() as Promise<PublicPrayerRequest[]>;
}

export async function getEvents(month?: string): Promise<Event[]> {
  const url = month ? `${API_BASE}/events?month=${month}` : `${API_BASE}/events`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: /events`);
  return res.json() as Promise<Event[]>;
}

export type EventWriteBody = {
  day: string;
  title: string;
  description: string;
  timeOfDay: string | null;
  location: string | null;
};

export async function createEvent(
  token: string,
  body: EventWriteBody,
): Promise<{ success: boolean; message: string; id: string }> {
  return apiFetch<{ success: boolean; message: string; id: string }>("/events", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateEvent(
  token: string,
  id: string,
  body: EventWriteBody,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/events/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(
  token: string,
  id: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/events/${id}`, token, {
    method: "DELETE",
  });
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE}/announcements`);
  if (!res.ok) throw new Error(`API ${res.status}: /announcements`);
  return res.json() as Promise<Announcement[]>;
}

export type AnnouncementWriteBody = {
  title: string;
  details: string;
  deleteDate: string;
};

export async function createAnnouncement(
  token: string,
  body: AnnouncementWriteBody,
): Promise<{ success: boolean; message: string; id: string }> {
  return apiFetch<{ success: boolean; message: string; id: string }>("/announcements", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAnnouncement(
  token: string,
  id: string,
  body: AnnouncementWriteBody,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/announcements/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAnnouncement(
  token: string,
  id: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/announcements/${id}`, token, {
    method: "DELETE",
  });
}

export async function getMeetingMinutes(token: string): Promise<MeetingMinutesSummary[]> {
  return apiFetch<MeetingMinutesSummary[]>("/meeting-minutes", token);
}

export async function getMeetingMinutesDetail(token: string, id: string): Promise<MeetingMinutesDetail> {
  return apiFetch<MeetingMinutesDetail>(`/meeting-minutes/${id}`, token);
}

export async function emailOfficer(token: string, officerTitle: string, message: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/emails/officer", token, {
    method: "POST",
    body: JSON.stringify({ officerTitle, message }),
  });
}

export async function submitNomination(token: string, knightOfMonth: string, familyOfMonth: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/nominations", token, {
    method: "POST",
    body: JSON.stringify({ knightOfMonth, familyOfMonth }),
  });
}

export async function emailAllMembers(token: string, message: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/emails/all-members", token, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
