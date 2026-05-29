"use client";

import { useState } from "react";

export type AnnouncementFormValues = {
  title: string;
  details: string;
  deleteDate: string;
};

type AnnouncementFormModalProps = {
  mode: "add" | "edit";
  initialValues?: AnnouncementFormValues;
  submitting?: boolean;
  onSave: (values: AnnouncementFormValues) => void;
  onCancel: () => void;
};

const EMPTY: AnnouncementFormValues = { title: "", details: "", deleteDate: "" };

export function AnnouncementFormModal({
  mode,
  initialValues,
  submitting = false,
  onSave,
  onCancel,
}: AnnouncementFormModalProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(initialValues ?? EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  const titleValid = values.title.trim().length > 0;
  const detailsValid = values.details.trim().length > 0;
  const dateValid = values.deleteDate.length > 0;
  const isValid = titleValid && detailsValid && dateValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSave({
      title: values.title.trim(),
      details: values.details.trim(),
      deleteDate: values.deleteDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-[#032147]">
          {mode === "add" ? "Add Announcement" : "Edit Announcement"}
        </h2>

        <label className="block text-sm font-medium text-[#032147]">
          Date to Delete
          <input
            type="date"
            value={values.deleteDate}
            onChange={(e) => setValues({ ...values, deleteDate: e.target.value })}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
          {showErrors && !dateValid && (
            <span className="mt-1 block text-xs text-red-700">Date to Delete is required.</span>
          )}
        </label>

        <label className="block text-sm font-medium text-[#032147]">
          Title
          <input
            type="text"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
          {showErrors && !titleValid && (
            <span className="mt-1 block text-xs text-red-700">Title is required.</span>
          )}
        </label>

        <label className="block text-sm font-medium text-[#032147]">
          Announcement Details
          <textarea
            value={values.details}
            onChange={(e) => setValues({ ...values, details: e.target.value })}
            rows={5}
            maxLength={2000}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
          {showErrors && !detailsValid && (
            <span className="mt-1 block text-xs text-red-700">Announcement Details is required.</span>
          )}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-[#888888] px-4 py-2 text-sm font-semibold text-[#032147] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
