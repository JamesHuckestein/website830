"use client";

import { useState } from "react";

export type PhotoFormValues = {
  title: string;
  photoUrl: string;
};

type PhotoFormModalProps = {
  mode: "add" | "edit";
  initialValues?: PhotoFormValues;
  submitting?: boolean;
  onSave: (values: PhotoFormValues) => void;
  onCancel: () => void;
};

const EMPTY: PhotoFormValues = { title: "", photoUrl: "" };

export function PhotoFormModal({
  mode,
  initialValues,
  submitting = false,
  onSave,
  onCancel,
}: PhotoFormModalProps) {
  const [values, setValues] = useState<PhotoFormValues>(initialValues ?? EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  const titleValid = values.title.trim().length > 0;
  const photoUrlValid = values.photoUrl.trim().length > 0;
  const isValid = titleValid && photoUrlValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSave({
      title: values.title.trim(),
      photoUrl: values.photoUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-[#032147]">
          {mode === "add" ? "Add Photo" : "Edit Photo"}
        </h2>

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

        <div>
          <label className="block text-sm font-medium text-[#032147]">
            Upload Photo
            <input
              type="text"
              value={values.photoUrl}
              onChange={(e) => setValues({ ...values, photoUrl: e.target.value })}
              maxLength={2048}
              className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
            />
          </label>
          <span className="mt-1 block text-xs text-[#888888]">
            Supported formats: JPEG, PNG, WebP, GIF.
          </span>
          {showErrors && !photoUrlValid && (
            <span className="mt-1 block text-xs text-red-700">Upload Photo is required.</span>
          )}
        </div>

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
