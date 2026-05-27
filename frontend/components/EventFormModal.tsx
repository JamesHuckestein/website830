"use client";

import { useState } from "react";

import { formatDay } from "@/lib/date";

export type EventFormValues = {
  title: string;
  description: string;
  timeOfDay: string | null;
  location: string | null;
};

type EventFormModalProps = {
  mode: "add" | "edit";
  day: string;
  initialValues?: EventFormValues;
  submitting?: boolean;
  onSave: (values: EventFormValues) => void;
  onCancel: () => void;
};

const EMPTY: EventFormValues = { title: "", description: "", timeOfDay: null, location: null };

export function EventFormModal({ mode, day, initialValues, submitting = false, onSave, onCancel }: EventFormModalProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues ?? EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  const titleValid = values.title.trim().length > 0;
  const descriptionValid = values.description.trim().length > 0;
  const isValid = titleValid && descriptionValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSave({
      title: values.title.trim(),
      description: values.description.trim(),
      timeOfDay: values.timeOfDay || null,
      location: values.location && values.location.trim().length > 0 ? values.location.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-[#032147]">
          {mode === "add" ? "Add Event" : "Edit Event"}
        </h2>
        <p className="text-sm text-[#888888]">{formatDay(day)}</p>

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
          Description
          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            rows={4}
            maxLength={2000}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
          {showErrors && !descriptionValid && (
            <span className="mt-1 block text-xs text-red-700">Description is required.</span>
          )}
        </label>

        <label className="block text-sm font-medium text-[#032147]">
          Time (optional)
          <input
            type="time"
            value={values.timeOfDay ?? ""}
            onChange={(e) => setValues({ ...values, timeOfDay: e.target.value || null })}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-[#032147]">
          Location (optional)
          <input
            type="text"
            value={values.location ?? ""}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
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
