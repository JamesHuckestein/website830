"use client";

import type { Announcement } from "@/lib/api";

type AnnouncementDetailModalProps = {
  announcement: Announcement;
  onClose: () => void;
};

export function AnnouncementDetailModal({ announcement, onClose }: AnnouncementDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#032147]">{announcement.title}</h2>
        <p className="whitespace-pre-line text-sm text-[#032147]">{announcement.details}</p>
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
