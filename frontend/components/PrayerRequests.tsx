"use client";

import { useEffect, useState } from "react";

import {
  createPrayerRequest,
  deletePrayerRequest,
  getPrayerRequests,
  type PrayerRequest,
} from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SubmitModal } from "@/components/SubmitModal";

type PrayerRequestsProps = {
  token: string;
  memberNumber: string;
  isOfficer: boolean;
  onBack: () => void;
};

export function PrayerRequests({ token, memberNumber, isOfficer, onBack }: PrayerRequestsProps) {
  const [requests, setRequests] = useState<PrayerRequest[] | null>(null);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getPrayerRequests(token).then(setRequests).catch(() => setRequests([]));
  }, [token, refreshKey]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const result = await createPrayerRequest(token, text.trim());
      setText("");
      setModal({ success: true, message: result.message });
    } catch {
      setModal({ success: false, message: "Failed to submit prayer request. Please try again." });
    }
  };

  const handleConfirmDelete = async () => {
    setConfirming(false);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => deletePrayerRequest(token, id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    setSelected(new Set());
    setRefreshKey((k) => k + 1);
    if (failed === 0) {
      setModal({ success: true, message: `Deleted ${ids.length} prayer request${ids.length === 1 ? "" : "s"}.` });
    } else if (failed === ids.length) {
      setModal({ success: false, message: "Failed to delete prayer request(s). Please try again." });
    } else {
      setModal({
        success: false,
        message: `Deleted ${ids.length - failed} of ${ids.length} prayer request(s); ${failed} could not be deleted.`,
      });
    }
  };

  const handleDismiss = () => {
    if (modal?.success) setRefreshKey((k) => k + 1);
    setModal(null);
  };

  if (!requests) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  const selectedCount = selected.size;

  return (
    <>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={handleDismiss} />}
      {confirming && (
        <ConfirmDialog
          title="Delete prayer request(s)?"
          message={`Delete ${selectedCount} prayer request${selectedCount === 1 ? "" : "s"}? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#032147]">Prayer Requests</h2>
        <form onSubmit={handleSubmit} className="max-w-md space-y-3">
          <label className="block text-sm font-medium text-[#032147]">
            Submit a Prayer Request
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
              placeholder="Enter your prayer intention..."
            />
          </label>
          <p className="text-xs text-[#888888]">
            Note: submitted intentions are visible to all visitors of the public Prayer Requests page. Please do not include sensitive personal details.
          </p>
          <button
            type="submit"
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
          >
            Submit
          </button>
        </form>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#032147]">Current Intentions</h3>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0}
              className="rounded-md border border-[#753991] px-3 py-1 text-sm font-semibold text-[#753991] disabled:opacity-50"
            >
              {selectedCount > 0 ? `Delete Selected (${selectedCount})` : "Delete Selected"}
            </button>
          </div>
          <ul className="space-y-3">
            {requests.map((req) => {
              const isOwn = req.submittedBy === memberNumber;
              const canDelete = isOwn || isOfficer;
              const isChecked = selected.has(req.id);
              return (
                <li key={req.id} className="flex gap-3 rounded-md border border-[#E7E7E7] p-3 text-sm">
                  {canDelete ? (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelected(req.id)}
                      aria-label={`Select prayer request ${req.id}`}
                      className="mt-1 accent-[#753991]"
                    />
                  ) : (
                    <span className="mt-1 w-4" aria-hidden="true" />
                  )}
                  <div className="flex-1">
                    <p className="text-[#032147]">{req.text}</p>
                    <p className="mt-1 text-xs text-[#888888]">
                      {new Date(req.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {!isOwn && ` · submitted by ${req.submittedBy}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
          Back to Members Area
        </button>
      </section>
    </>
  );
}
