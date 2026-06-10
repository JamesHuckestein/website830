"use client";

import { useEffect, useState } from "react";

import { getPublicPrayerRequests, type PublicPrayerRequest } from "@/lib/api";
import { sectionContent } from "@/data/siteData";

export function PublicPrayerRequests() {
  const [requests, setRequests] = useState<PublicPrayerRequest[] | null>(null);

  useEffect(() => {
    getPublicPrayerRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#032147]">{sectionContent.prayer.title}</h2>
      <p className="text-[#888888]">{sectionContent.prayer.body}</p>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#032147]">Current Intentions</h3>
        {requests === null ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-[#888888]">No current intentions.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => (
              <li key={req.id} className="rounded-md border border-[#E7E7E7] p-3 text-sm">
                <p className="text-[#032147]">{req.text}</p>
                <p className="mt-1 text-xs text-[#888888]">
                  {new Date(req.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
