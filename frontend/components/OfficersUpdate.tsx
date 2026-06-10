"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { OfficerEditModal } from "@/components/OfficerEditModal";
import { SubmitModal } from "@/components/SubmitModal";
import { getOfficers, type OfficerResponse } from "@/lib/api";

type OfficersUpdateProps = {
  token: string;
  onBack: () => void;
};

export function OfficersUpdate({ token, onBack }: OfficersUpdateProps) {
  const [officers, setOfficers] = useState<OfficerResponse[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOfficers()
      .then((data) => {
        if (!cancelled) setOfficers(data);
      })
      .catch(() => {
        if (!cancelled) setOfficers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-[#753991] px-3 py-1 text-sm font-semibold text-[#753991]"
        >
          Back
        </button>
        <h2 className="text-2xl font-semibold text-[#032147]">Update Officers</h2>
      </div>

      {officers === null ? (
        <p className="text-sm text-[#888888]">Loading officers...</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {officers.map((officer) => (
            <li
              key={officer.title}
              className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white"
            >
              <div className="flex justify-center bg-[#F5F5F5] p-2">
                <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
                  <Image
                    src={officer.photoUrl}
                    alt={`${officer.name} - ${officer.title}`}
                    width={384}
                    height={512}
                    className="block h-36 w-auto max-w-full object-contain object-top"
                    sizes="(max-width: 640px) 42vw, 11rem"
                  />
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="font-semibold text-[#032147]">{officer.title}</p>
                <p className="text-sm text-[#888888]">{officer.name}</p>
              </div>
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => setEditingTitle(officer.title)}
                  className="w-full rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingTitle !== null && (
        <OfficerEditModal
          title={editingTitle}
          token={token}
          onClose={() => setEditingTitle(null)}
          onSaved={(msg) => {
            setEditingTitle(null);
            setFeedback({ success: true, message: msg });
            setRefreshKey((k) => k + 1);
          }}
          onError={(msg) => {
            setEditingTitle(null);
            setFeedback({ success: false, message: msg });
          }}
        />
      )}

      {feedback !== null && (
        <SubmitModal
          success={feedback.success}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </section>
  );
}
