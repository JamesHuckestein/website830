"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SubmitModal } from "@/components/SubmitModal";
import { createMeetingMinutes, deleteMeetingMinutes, getMeetingMinutes } from "@/lib/api";

type MeetingMinutesSummary = {
  id: string;
  title: string;
  meetingDate: string;
  s3Key: string;
};

type MeetingMinutesUpdateProps = {
  token: string;
  onBack: () => void;
};

export function MeetingMinutesUpdate({ token, onBack }: MeetingMinutesUpdateProps) {
  const [entries, setEntries] = useState<MeetingMinutesSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getMeetingMinutes(token).then(setEntries).catch(() => setEntries([]));
  }, [token, refreshKey]);

  useEffect(() => {
    if (selectedId && !entries.find((e) => e.id === selectedId)) {
      setSelectedId(null);
    }
  }, [entries, selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetingDate || !file) return;
    setSubmitting(true);
    try {
      const result = await createMeetingMinutes(token, title.trim(), meetingDate, file);
      setModal(result);
      if (result.success) {
        setTitle("");
        setMeetingDate("");
        setFile(null);
        setShowForm(false);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setModal({ success: false, message: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    setConfirming(false);
    setSubmitting(true);
    try {
      const result = await deleteMeetingMinutes(token, selectedId);
      setModal(result);
      setSelectedId(null);
      setRefreshKey((k) => k + 1);
    } catch {
      setModal({ success: false, message: "Failed to delete meeting minutes." });
    } finally {
      setSubmitting(false);
    }
  }, [token, selectedId]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#032147]">Edit Meeting Minutes</h2>
        <button
          onClick={onBack}
          className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
        >
          Back
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setShowForm(true); setSelectedId(null); }}
          disabled={submitting}
          className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add Meeting Minutes
        </button>
        {selectedId && (
          <button
            onClick={() => setConfirming(true)}
            disabled={submitting}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-md space-y-3 rounded-md border border-[#888888] p-4">
          <div className="space-y-1">
            <label htmlFor="mm-title" className="block text-sm font-medium text-[#032147]">Title *</label>
            <input
              id="mm-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
              disabled={submitting}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="mm-date" className="block text-sm font-medium text-[#032147]">Meeting Date *</label>
            <input
              id="mm-date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
              className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
              disabled={submitting}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="mm-file" className="block text-sm font-medium text-[#032147]">PDF File *</label>
            <input
              id="mm-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm"
              disabled={submitting}
            />
            <p className="text-xs text-[#888888]">Only PDF files are accepted.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !meetingDate || !file}
              className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setTitle(""); setMeetingDate(""); setFile(null); }}
              disabled={submitting}
              className="rounded-md border border-[#888888] px-4 py-2 text-sm font-semibold text-[#032147] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-[#888888]">No meeting minutes uploaded yet.</p>}
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            className={`cursor-pointer rounded-md border p-3 transition-colors ${
              selectedId === entry.id
                ? "border-[#4169E1] bg-blue-50 ring-2 ring-[#4169E1]"
                : "border-[#888888] hover:border-[#4169E1]"
            }`}
          >
            <p className="font-medium text-[#032147]">{entry.title}</p>
            <p className="text-sm text-[#888888]">{entry.meetingDate}</p>
          </div>
        ))}
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete Meeting Minutes"
          message="Are you sure you want to delete this meeting minutes entry? The uploaded PDF will also be removed."
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={() => setModal(null)} />}
    </section>
  );
}
