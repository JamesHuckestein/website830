"use client";

import { useEffect, useState } from "react";

import { getMeetingMinutes, getMeetingMinutesDetail, type MeetingMinutesDetail, type MeetingMinutesSummary } from "@/lib/api";

type MeetingMinutesProps = {
  token: string;
  detailId: string | null;
  onSelectMinute: (id: string) => void;
  onBackToList: () => void;
  onBackToMembersArea: () => void;
};

export function MeetingMinutes({ token, detailId, onSelectMinute, onBackToList, onBackToMembersArea }: MeetingMinutesProps) {
  const [entries, setEntries] = useState<MeetingMinutesSummary[] | null>(null);
  const [detail, setDetail] = useState<MeetingMinutesDetail | null>(null);

  useEffect(() => {
    getMeetingMinutes(token).then(setEntries).catch(() => setEntries([]));
  }, [token]);

  useEffect(() => {
    if (!detailId) { setDetail(null); return; }
    getMeetingMinutesDetail(token, detailId).then(setDetail).catch(() => setDetail(null));
  }, [token, detailId]);

  if (detailId) {
    if (!detail) {
      return <p className="text-sm text-[#888888]">Loading...</p>;
    }
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#032147]">{detail.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={onBackToList}
              className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
            >
              Back to List
            </button>
            <button
              onClick={onBackToMembersArea}
              className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
            >
              Back
            </button>
          </div>
        </div>
        <p className="text-sm text-[#888888]">
          {new Date(detail.meetingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        {detail.url ? (
          <a
            href={detail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#032147]"
          >
            Download PDF
          </a>
        ) : (
          <div className="rounded-md border border-[#E7E7E7] bg-[#F5F5F5] p-4 text-sm text-[#888888]">
            PDF not available.
          </div>
        )}
      </section>
    );
  }

  if (!entries) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#032147]">Council Meeting Minutes</h2>
        <button
          onClick={onBackToMembersArea}
          className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
        >
          Back
        </button>
      </div>
      <ul className="divide-y divide-[#E7E7E7]">
        {entries.map((entry) => (
          <li key={entry.id} className="py-3">
            <button
              type="button"
              onClick={() => onSelectMinute(entry.id)}
              className="text-left text-sm font-medium text-[#4169E1] underline hover:text-[#032147]"
            >
              {entry.title}
            </button>
            <p className="text-xs text-[#888888]">
              {new Date(entry.meetingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
