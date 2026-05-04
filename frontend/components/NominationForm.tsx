"use client";

import { useState } from "react";

import { submitNomination } from "@/lib/api";

type NominationFormProps = {
  token: string;
  onBack: () => void;
};

export function NominationForm({ token, onBack }: NominationFormProps) {
  const [knight, setKnight] = useState("");
  const [family, setFamily] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitNomination(token, knight, family);
    setKnight("");
    setFamily("");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Knight and Family of the Month</h2>
      <p className="text-sm text-[#888888]">
        Nominate a fellow knight and family to be recognized this month.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3">
        <label className="block text-sm font-medium text-[#032147]">
          Knight of the Month
          <input
            value={knight}
            onChange={(e) => setKnight(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
            placeholder="Full name"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          Family of the Month
          <input
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
            placeholder="Family name"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
        >
          Send
        </button>
      </form>
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
