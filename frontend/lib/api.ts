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
  isAuxiliaryOfficer: boolean;
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

export type Photo = {
  id: string;
  title: string;
  photoUrl: string;
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
      if (typeof body?.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body?.detail)) {
        detail = body.detail.map((e: { msg?: string; loc?: string[] }) => {
          const field = e.loc?.slice(-1)[0] ?? "";
          return field ? `${field}: ${e.msg}` : (e.msg ?? "");
        }).filter(Boolean).join("; ");
      }
    } catch {
      // non-JSON error body — fall through to generic message
    }
    throw new Error(detail || `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export type LoginResponse = {
  token: string;
  memberNumber?: string;
  isOfficer?: boolean;
  officerPosition?: string | null;
  isAdmin?: boolean;
};

export async function loginMember(membershipNumber: string, passcode: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membershipNumber, passcode }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json() as Promise<LoginResponse>;
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

export type MemberFormData = {
  memberNumber: string;
  passcode: string | null;
  firstName: string;
  lastName: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  phone: string;
  birthday: string;
  email: string;
  assemblyNumber: string | null;
  firstDegreeDate: string;
  secondDegreeDate: string;
  thirdDegreeDate: string;
  fourthDegreeDate: string | null;
};

export async function createMember(token: string, data: MemberFormData): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/members", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMemberFull(token: string, memberId: string, data: MemberFormData): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/members/${memberId}/full`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMember(token: string, memberId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/members/${memberId}`, token, {
    method: "DELETE",
  });
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

export async function getPhotos(): Promise<Photo[]> {
  const res = await fetch(`${API_BASE}/photos`);
  if (!res.ok) throw new Error(`API ${res.status}: /photos`);
  return res.json() as Promise<Photo[]>;
}

export async function createPhoto(
  token: string,
  title: string,
  file: globalThis.File,
): Promise<{ success: boolean; message: string; id: string }> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function updatePhoto(
  token: string,
  id: string,
  title: string,
  file: globalThis.File,
): Promise<{ success: boolean; message: string }> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/photos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function deletePhoto(
  token: string,
  id: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/photos/${id}`, token, {
    method: "DELETE",
  });
}

export type OfficerResponse = {
  title: string;
  name: string;
  photoUrl: string;
};

export async function getOfficers(): Promise<OfficerResponse[]> {
  const res = await fetch(`${API_BASE}/officers`);
  if (!res.ok) throw new Error(`API ${res.status}: /officers`);
  return res.json() as Promise<OfficerResponse[]>;
}

export async function updateOfficer(
  token: string,
  title: string,
  body: { memberNumber: string; photoData: string; photoFilename: string },
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/officers/${encodeURIComponent(title)}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getMeetingMinutes(token: string): Promise<MeetingMinutesSummary[]> {
  return apiFetch<MeetingMinutesSummary[]>("/meeting-minutes", token);
}

export async function getMeetingMinutesDetail(token: string, id: string): Promise<MeetingMinutesDetail> {
  return apiFetch<MeetingMinutesDetail>(`/meeting-minutes/${id}`, token);
}

export async function createMeetingMinutes(token: string, title: string, meetingDate: string, file: globalThis.File): Promise<{ success: boolean; message: string; id?: string }> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("meetingDate", meetingDate);
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/meeting-minutes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function deleteMeetingMinutes(token: string, id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/meeting-minutes/${id}`, token, {
    method: "DELETE",
  });
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

export async function updateAdminPassword(token: string, passcode: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/admin/password", token, {
    method: "PUT",
    body: JSON.stringify({ passcode }),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/members/change-password", token, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function grantAuxiliaryOfficer(token: string, memberNumber: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/members/${memberNumber}/auxiliary-officer`, token, {
    method: "POST",
  });
}

export async function revokeAuxiliaryOfficer(token: string, memberNumber: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/members/${memberNumber}/auxiliary-officer`, token, {
    method: "DELETE",
  });
}
