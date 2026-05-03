"use client";

import { useState } from "react";
import Image from "next/image";

import { officers } from "@/data/siteData";

type OfficerContactsProps = {
  onBack: () => void;
};

export function OfficerContacts({ onBack }: OfficerContactsProps) {
  const [composingFor, setComposingFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const officer = composingFor ? officers.find((o) => o.title === composingFor) : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setComposingFor(null);
  };

  if (composingFor && officer) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">Email {officer.name}</h2>
        <p className="text-sm text-[#888888]">{officer.title}</p>
        <form onSubmit={handleSend} className="max-w-md space-y-3">
          <label className="block text-sm font-medium text-[#032147]">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-3">
            <button type="submit" className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white">
              Send
            </button>
            <button type="button" onClick={() => setComposingFor(null)} className="rounded-md border border-[#D3D3D3] px-4 py-2 text-sm text-[#888888]">
              Cancel
            </button>
          </div>
        </form>
        <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
          Back to Members Area
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Officers</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {officers.map((o) => (
          <li key={o.title} className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
            <div className="flex justify-center bg-[#F5F5F5] p-2">
              <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
                <Image
                  src={o.imageUrl}
                  alt={`${o.name} - ${o.title}`}
                  width={120}
                  height={160}
                  className="block h-24 w-auto object-contain object-top"
                />
              </div>
            </div>
            <div className="space-y-2 p-3">
              <p className="font-semibold text-[#032147]">{o.title}</p>
              <p className="text-sm text-[#888888]">{o.name}</p>
              <button
                type="button"
                onClick={() => setComposingFor(o.title)}
                className="rounded-md bg-[#4169E1] px-3 py-1 text-xs font-semibold text-white"
              >
                Send Email
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
