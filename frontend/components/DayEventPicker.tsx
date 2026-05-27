"use client";

import type { Event } from "@/lib/api";
import { formatDay } from "@/lib/date";

type DayEventPickerProps = {
  day: string;
  events: Event[];
  actionLabel: "Edit" | "Delete";
  onPick: (event: Event) => void;
  onCancel: () => void;
};

export function DayEventPicker({ day, events, actionLabel, onPick, onCancel }: DayEventPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#032147]">
          {actionLabel} which event?
        </h2>
        <p className="text-sm text-[#888888]">{formatDay(day)}</p>
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onPick(ev)}
                className="w-full rounded-md border border-[#BFA149] px-4 py-2 text-left text-sm font-medium text-[#032147] hover:bg-[#F6F0DF]"
              >
                {ev.title}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#888888] px-4 py-2 text-sm font-semibold text-[#032147]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
