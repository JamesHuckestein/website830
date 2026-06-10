"use client";

import { useState } from "react";
import Image from "next/image";

type FacilitiesManagerFormProps = {
  onBack: () => void;
};

export function FacilitiesManagerForm({ onBack }: FacilitiesManagerFormProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    onBack();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-[#032147]">
            Facilities Manager: John Hanel
          </p>
          <div className="rounded-md border border-[#E0E0E0] bg-[#F5F5F5] p-1 w-fit">
            <Image
              src="/officers/2026Hanel.jpg"
              alt="John Hanel - Facilities Manager"
              width={180}
              height={240}
              className="block rounded object-contain"
            />
          </div>
          <p className="text-sm text-[#888888]">972-977-4766</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
          <label className="block text-sm font-medium text-[#032147]">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
              placeholder="Type your message to the Facilities Manager..."
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-[#D3D3D3] px-4 py-2 text-sm text-[#888888]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
