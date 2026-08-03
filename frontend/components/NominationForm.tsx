"use client";

import { useState } from "react";

import { submitNomination } from "@/lib/api";
import { SubmitModal } from "@/components/SubmitModal";

type NominationFormProps = {
  token: string;
  onBack: () => void;
};

export function NominationForm({ token, onBack }: NominationFormProps) {
  const [knight, setKnight] = useState("");
  const [family, setFamily] = useState("");
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitNomination(token, knight, family);
      setModal({ success: true, message: result.message });
    } catch {
      setModal({ success: false, message: "Failed to submit nomination. Please try again." });
    }
  };

  const handleDismiss = () => {
    if (modal?.success) {
      setKnight("");
      setFamily("");
    }
    setModal(null);
  };

  return (
    <>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={handleDismiss} />}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#032147]">Knight and Family of the Month</h2>
          <button
            onClick={onBack}
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            Back
          </button>
        </div>
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
      </section>
    </>
  );
}
