"use client";

import { useEffect, useState } from "react";

import { AnnouncementDetailModal } from "@/components/AnnouncementDetailModal";
import { getAnnouncements, type Announcement } from "@/lib/api";

export function News() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements()
      .then((data) => {
        if (!cancelled) setAnnouncements(data);
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {selected && (
        <AnnouncementDetailModal announcement={selected} onClose={() => setSelected(null)} />
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">News & Announcements</h2>
        {announcements === null ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-[#888888]">No current announcements.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a)}
                  className="w-full rounded-md border border-[#BFA149] px-4 py-3 text-left text-sm font-medium text-[#032147] hover:bg-[#F6F0DF]"
                >
                  {a.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
