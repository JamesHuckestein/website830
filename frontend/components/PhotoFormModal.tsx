"use client";

import { useRef, useState } from "react";

export type PhotoFormResult = {
  title: string;
  file: File;
};

type PhotoFormModalProps = {
  mode: "add" | "edit";
  initialTitle?: string;
  submitting?: boolean;
  onSave: (values: PhotoFormResult) => void;
  onCancel: () => void;
};

export function PhotoFormModal({
  mode,
  initialTitle,
  submitting = false,
  onSave,
  onCancel,
}: PhotoFormModalProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleValid = title.trim().length > 0;
  const fileValid = photoFile !== null;
  const isValid = titleValid && fileValid;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSave({ title: title.trim(), file: photoFile! });
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
          {showErrors && !titleValid && (
            <span className="mt-1 block text-xs text-red-700">Title is required.</span>
          )}
        </label>

        <div>
          <label htmlFor="photo-file-upload" className="block text-sm font-medium text-[#032147]">
            Upload Photo
          </label>
          <input
            id="photo-file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="mt-1 w-full text-sm text-[#032147] file:mr-3 file:rounded-md file:border-0 file:bg-[#4169E1] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          />
          <span className="mt-1 block text-xs text-[#888888]">
            Supported formats: JPEG, PNG, WebP, GIF.
          </span>
          {showErrors && !fileValid && (
            <span className="mt-1 block text-xs text-red-700">A photo file is required.</span>
          )}
          {photoFile && (
            <p className="mt-1 text-xs text-[#888888]">Selected: {photoFile.name}</p>
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
