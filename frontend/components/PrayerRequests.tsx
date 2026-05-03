"use client";

import { useState } from "react";

import { dummyPrayerRequests } from "@/data/siteData";

type PrayerRequestsProps = {
  onBack: () => void;
};

export function PrayerRequests({ onBack }: PrayerRequestsProps) {
  const [requests, setRequests] = useState(dummyPrayerRequests);
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setRequests([
      {
        id: `pr-${Date.now()}`,
        text: text.trim(),
        submittedBy: "8301001",
        submittedAt: new Date().toISOString(),
      },
      ...requests,
    ]);
    setText("");
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#032147]">Prayer Requests</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3">
        <label className="block text-sm font-medium text-[#032147]">
          Submit a Prayer Request
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
            placeholder="Enter your prayer intention..."
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
        >
          Submit
        </button>
      </form>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#032147]">Current Intentions</h3>
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
      </div>
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
