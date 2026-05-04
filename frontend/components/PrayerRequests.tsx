"use client";

import { useEffect, useState } from "react";

import { createPrayerRequest, getPrayerRequests, type PrayerRequest } from "@/lib/api";

type PrayerRequestsProps = {
  token: string;
  onBack: () => void;
};

export function PrayerRequests({ token, onBack }: PrayerRequestsProps) {
  const [requests, setRequests] = useState<PrayerRequest[] | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    getPrayerRequests(token).then(setRequests).catch(() => setRequests([]));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const created = await createPrayerRequest(token, text.trim());
    setRequests((prev) => (prev ? [created, ...prev] : [created]));
    setText("");
  };

  if (!requests) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

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
