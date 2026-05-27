"use client";

import type { Event } from "@/lib/api";
import { formatDay } from "@/lib/date";

type EventDetailModalProps = {
  event: Event;
  onClose: () => void;
};

function formatTime12Hour(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h24 = parseInt(hStr, 10);
  const m = mStr;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m} ${period}`;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#032147]">{event.title}</h2>
        <p className="text-sm text-[#032147]">{formatDay(event.day)}</p>
        {event.timeOfDay && (
          <p className="text-sm text-[#888888]">Time: {formatTime12Hour(event.timeOfDay)}</p>
        )}
        {event.location && (
          <p className="text-sm text-[#888888]">Location: {event.location}</p>
        )}
        <p className="whitespace-pre-line text-sm text-[#032147]">{event.description}</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
