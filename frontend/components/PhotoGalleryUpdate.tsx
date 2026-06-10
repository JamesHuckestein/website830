"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PhotoCard } from "@/components/PhotoCard";
import {
  PhotoFormModal,
  type PhotoFormValues,
} from "@/components/PhotoFormModal";
import { SubmitModal } from "@/components/SubmitModal";
import {
  createPhoto,
  deletePhoto,
  getPhotos,
  updatePhoto,
  type Photo,
} from "@/lib/api";

type PhotoGalleryUpdateProps = {
  token: string;
  onBack: () => void;
};

export function PhotoGalleryUpdate({ token, onBack }: PhotoGalleryUpdateProps) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [formOpen, setFormOpen] = useState<{ mode: "add" | "edit"; target: Photo | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Photo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPhotos()
      .then((data) => {
        if (!cancelled) setPhotos(data);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Clear a stale selectedId if the underlying row disappears from a refresh
  // (e.g., another officer deleted it between mount and refetch).
  useEffect(() => {
    if (selectedId && photos && !photos.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [photos, selectedId]);

  const selected = selectedId && photos ? photos.find((p) => p.id === selectedId) ?? null : null;

  const handleAddClick = () => {
    setFormOpen({ mode: "add", target: null });
  };

  const handleEditClick = () => {
    if (!selected) {
      setFeedback({ success: false, message: "Please select a photo first." });
      return;
    }
    setFormOpen({ mode: "edit", target: selected });
  };

  const handleDeleteClick = () => {
    if (!selected) {
      setFeedback({ success: false, message: "Please select a photo first." });
      return;
    }
    setConfirmDelete(selected);
  };

  const handleFormSave = async (values: PhotoFormValues) => {
    if (!formOpen || submitting) return;
    const body = { title: values.title, photoUrl: values.photoUrl };
    const isAdd = formOpen.mode === "add";
    const editTarget = formOpen.target;
    setSubmitting(true);
    try {
      const result = isAdd
        ? await createPhoto(token, body)
        : editTarget
          ? await updatePhoto(token, editTarget.id, body)
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
              ? "Failed to add photo. Please try again."
              : "Failed to update photo. Please try again.",
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
      const result = await deletePhoto(token, target.id);
      setFeedback({ success: true, message: result.message });
      setSelectedId((curr) => (curr === target.id ? null : curr));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFeedback({
        success: false,
        message:
          err instanceof Error && err.message
            ? err.message
            : "Failed to delete photo. Please try again.",
      });
    }
  };

  if (photos === null) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <>
      {formOpen && (
        <PhotoFormModal
          mode={formOpen.mode}
          initialValues={
            formOpen.target
              ? { title: formOpen.target.title, photoUrl: formOpen.target.photoUrl }
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
        <h2 className="text-2xl font-semibold text-[#032147]">Edit Photo Gallery</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-[#888888]">No photos yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {photos.map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select photo ${p.title}`}
                    className={`block w-full rounded-md border text-left ${
                      isSelected ? "border-[#753991] bg-[#753991]/10" : "border-transparent"
                    }`}
                  >
                    <PhotoCard photo={p} />
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
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#4169E1] underline"
        >
          Back to Members Area
        </button>
      </section>
    </>
  );
}
