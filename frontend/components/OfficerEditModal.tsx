"use client";

import { useEffect, useRef, useState } from "react";

import { getMembers, updateOfficer, type MemberResponse } from "@/lib/api";

type OfficerEditModalProps = {
  title: string;
  token: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

export function OfficerEditModal({ title, token, onClose, onSaved, onError }: OfficerEditModalProps) {
  const [members, setMembers] = useState<MemberResponse[] | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [filterText, setFilterText] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMembers(token)
      .then((data) => {
        if (!cancelled) setMembers(data);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMembers = members
    ? members.filter((m) => {
        const name = `${m.lastName}, ${m.firstName}`.toLowerCase();
        return name.includes(filterText.toLowerCase());
      })
    : [];

  const selectedMemberName = members
    ? (() => {
        const m = members.find((mem) => mem.memberNumber === selectedMember);
        return m ? `${m.lastName}, ${m.firstName}` : "";
      })()
    : "";

  const canSave = selectedMember !== "" && photoFile !== null && !submitting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "image/png") {
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setPhotoFile(file);
  };

  const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!canSave || !photoFile) return;
    setSubmitting(true);
    try {
      const base64 = await resizeImage(photoFile, 350);
      const result = await updateOfficer(token, title, {
        memberNumber: selectedMember,
        photoData: base64,
        photoFilename: photoFile.name,
      });
      onSaved(result.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update officer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md space-y-5 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#032147]">Edit {title}</h2>
        <p className="text-xs text-[#888888]">
          Please select a Member from the list and a valid photo to upload. Only PNG formatted photos are allowed.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#032147]">Member Name</label>
          <div ref={dropdownRef} className="relative">
            <input
              type="text"
              value={dropdownOpen ? filterText : selectedMemberName}
              onChange={(e) => {
                setFilterText(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
                setFilterText("");
              }}
              placeholder="Type to search members..."
              className="w-full rounded-md border border-[#E7E7E7] px-3 py-2 text-sm text-[#032147] focus:border-[#4169E1] focus:outline-none"
            />
            {dropdownOpen && members !== null && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[#E7E7E7] bg-white shadow-lg">
                {filteredMembers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-[#888888]">No members found</li>
                ) : (
                  filteredMembers.map((m) => (
                    <li key={m.memberNumber}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(m.memberNumber);
                          setFilterText("");
                          setDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[#032147] hover:bg-[#F6F0DF]"
                      >
                        {m.lastName}, {m.firstName}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="officer-photo-upload" className="block text-sm font-medium text-[#032147]">Upload Photo</label>
          <input
            id="officer-photo-upload"
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            onChange={handleFileChange}
            className="w-full text-sm text-[#032147] file:mr-3 file:rounded-md file:border-0 file:bg-[#4169E1] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          />
          {photoFile && (
            <p className="text-xs text-[#888888]">Selected: {photoFile.name}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
