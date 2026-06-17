"use client";

import { useEffect, useState } from "react";

import {
  AnnouncementFormModal,
  type AnnouncementFormValues,
} from "@/components/AnnouncementFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SubmitModal } from "@/components/SubmitModal";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  type Announcement,
} from "@/lib/api";

type AnnouncementsUpdateProps = {
  token: string;
  onBack: () => void;
};

export function AnnouncementsUpdate({ token, onBack }: AnnouncementsUpdateProps) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [formOpen, setFormOpen] = useState<{ mode: "add" | "edit"; target: Announcement | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements()
      .then((data) => {
        if (!cancelled) setAnnouncements(data);
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Clear a stale selectedId if the underlying row disappears from a refresh
  // (e.g., another officer deleted it, or it expired between mount and refetch).
  useEffect(() => {
    if (selectedId && announcements && !announcements.some((a) => a.id === selectedId)) {
      setSelectedId(null);
    }
  }, [announcements, selectedId]);

  const selected =
    selectedId && announcements ? announcements.find((a) => a.id === selectedId) ?? null : null;

  const handleAddClick = () => {
    setFormOpen({ mode: "add", target: null });
  };

  const handleEditClick = () => {
    if (!selected) {
      setFeedback({ success: false, message: "Please select an announcement first." });
      return;
    }
    setFormOpen({ mode: "edit", target: selected });
  };

  const handleDeleteClick = () => {
    if (!selected) {
      setFeedback({ success: false, message: "Please select an announcement first." });
      return;
    }
    setConfirmDelete(selected);
  };

  const handleFormSave = async (values: AnnouncementFormValues) => {
    if (!formOpen || submitting) return;
    const body = {
      title: values.title,
      details: values.details,
      deleteDate: values.deleteDate,
    };
    const isAdd = formOpen.mode === "add";
    const editTarget = formOpen.target;
    setSubmitting(true);
    try {
      const result = isAdd
        ? await createAnnouncement(token, body)
        : editTarget
          ? await updateAnnouncement(token, editTarget.id, body)
          : null;
      if (result) {
        setFeedback({ success: true, message: result.message });
        setFormOpen(null);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      setFeedback({
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : isAdd
              ? "Failed to create announcement. Please try again."
              : "Failed to update announcement. Please try again.",
      });
      // Leave formOpen as-is so the user can correct and retry with values preserved.
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmYes = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      const result = await deleteAnnouncement(token, target.id);
      setFeedback({ success: true, message: result.message });
      setSelectedId((curr) => (curr === target.id ? null : curr));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFeedback({
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : "Failed to delete announcement. Please try again.",
      });
    }
  };

  if (announcements === null) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <>
      {formOpen && (
        <AnnouncementFormModal
          mode={formOpen.mode}
          initialValues={
            formOpen.target
              ? {
                  title: formOpen.target.title,
                  details: formOpen.target.details,
                  deleteDate: formOpen.target.deleteDate,
                }
              : undefined
          }
          submitting={submitting}
          onSave={handleFormSave}
          onCancel={() => setFormOpen(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Confirm the delete?"
          message={`"${confirmDelete.title}"`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmYes}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {feedback && (
        <SubmitModal
          success={feedback.success}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#032147]">Edit Announcements</h2>
          <button
            onClick={onBack}
            className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
          >
            Back
          </button>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-[#888888]">No current announcements.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => {
              const isSelected = a.id === selectedId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select announcement ${a.title}`}
                    className={`w-full rounded-md border px-4 py-3 text-left text-sm font-medium text-[#032147] ${
                      isSelected
                        ? "border-[#753991] bg-[#753991]/10"
                        : "border-[#BFA149] hover:bg-[#F6F0DF]"
                    }`}
                  >
                    {a.title}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddClick}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleEditClick}
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991]"
          >
            Delete
          </button>
        </div>
      </section>
    </>
  );
}
