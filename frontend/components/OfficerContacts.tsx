"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { emailOfficer, getOfficers, type OfficerResponse } from "@/lib/api";
import { SubmitModal } from "@/components/SubmitModal";

type OfficerContactsProps = {
  token: string;
  onBack: () => void;
};

export function OfficerContacts({ token, onBack }: OfficerContactsProps) {
  const [officerList, setOfficerList] = useState<OfficerResponse[] | null>(null);
  const [composingFor, setComposingFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOfficers()
      .then((data) => { if (!cancelled) setOfficerList(data); })
      .catch(() => { if (!cancelled) setOfficerList([]); });
    return () => { cancelled = true; };
  }, []);

  const officer = composingFor && officerList ? officerList.find((o) => o.title === composingFor) : null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composingFor) return;
    try {
      const result = await emailOfficer(token, composingFor, message);
      setModal({ success: true, message: result.message });
    } catch {
      setModal({ success: false, message: "Failed to send message. Please try again." });
    }
  };

  const handleDismiss = () => {
    if (modal?.success) {
      setMessage("");
      setComposingFor(null);
    }
    setModal(null);
  };

  return (
    <>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={handleDismiss} />}
      {composingFor && officer ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#032147]">Email {officer.name}</h2>
            <button
              onClick={onBack}
              className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
            >
              Back
            </button>
          </div>
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
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#032147]">Officers</h2>
            <button
              onClick={onBack}
              className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
            >
              Back
            </button>
          </div>
          {officerList === null ? (
            <p className="text-sm text-[#888888]">Loading officers...</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {officerList.map((o) => (
                <li key={o.title} className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
                  <div className="flex justify-center bg-[#F5F5F5] p-2">
                    <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
                      <Image
                        src={o.photoUrl}
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
          )}
        </section>
      )}
    </>
  );
}
