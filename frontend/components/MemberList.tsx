"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MemberFormModal } from "@/components/MemberFormModal";
import { SubmitModal } from "@/components/SubmitModal";
import { PRIVILEGED_OFFICER_TITLES } from "@/data/siteData";
import {
  createMember,
  deleteMember,
  emailAllMembers,
  exportMembersCSV,
  getMembers,
  updateMemberFull,
  type MemberFormData,
  type MemberResponse,
} from "@/lib/api";

type MemberListProps = {
  token: string;
  isOfficer: boolean;
  isAdmin: boolean;
  officerPosition: string | null;
  onBack: () => void;
};

export function MemberList({ token, isOfficer, isAdmin, officerPosition, onBack }: MemberListProps) {
  const [members, setMembers] = useState<MemberResponse[] | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPrivileged = isAdmin || (officerPosition !== null && PRIVILEGED_OFFICER_TITLES.has(officerPosition));

  const fetchMembers = async () => {
    try {
      const data = await getMembers(token);
      setMembers(data);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  useEffect(() => {
    if (members && selectedMember) {
      const exists = members.some((m) => m.memberNumber === selectedMember);
      if (!exists) setSelectedMember(null);
    }
  }, [members, selectedMember]);

  const filteredMembers = useMemo(
    () => members
      ? members.filter((m) => {
          const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
          return fullName.includes(searchText.toLowerCase());
        })
      : null,
    [members, searchText],
  );

  const selectedMemberData = members?.find((m) => m.memberNumber === selectedMember) ?? null;

  const handleDownload = async () => {
    const blob = await exportMembersCSV(token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "koc-830-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await emailAllMembers(token, emailMessage);
      setModal({ success: true, message: result.message });
    } catch {
      setModal({ success: false, message: "Failed to send email. Please try again." });
    }
  };

  const handleFormSave = async (data: MemberFormData) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      let result: { success: boolean; message: string };
      if (formMode === "add") {
        result = await createMember(token, data);
      } else {
        result = await updateMemberFull(token, selectedMember!, data);
      }
      setFormMode(null);
      setFormError(null);
      await fetchMembers();
      setModal({ success: result.success, message: result.message });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      const result = await deleteMember(token, selectedMember!);
      setSelectedMember(null);
      await fetchMembers();
      setModal({ success: result.success, message: result.message });
    } catch (err) {
      setModal({ success: false, message: err instanceof Error ? err.message : "Delete failed." });
    }
  };

  const handleDismiss = () => {
    if (modal?.success) {
      setEmailMessage("");
      setShowEmailForm(false);
    }
    setModal(null);
  };

  if (!filteredMembers) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={handleDismiss} />}
      {formMode && (
        <MemberFormModal
          mode={formMode}
          member={formMode === "edit" ? selectedMemberData : null}
          submitting={formSubmitting}
          error={formError}
          onSave={handleFormSave}
          onCancel={() => { setFormMode(null); setFormError(null); }}
        />
      )}
      {showDeleteConfirm && selectedMemberData && (
        <ConfirmDialog
          title="Delete Member"
          message={`Are you sure you want to delete ${selectedMemberData.firstName} ${selectedMemberData.lastName} from the member list?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">Member List</h2>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name..."
          className="w-full max-w-sm rounded-md border border-[#E7E7E7] px-3 py-2 text-sm text-[#032147] focus:border-[#4169E1] focus:outline-none"
        />

        <div className="max-h-[625px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E7E7] text-left text-xs font-semibold uppercase tracking-wide text-[#888888]">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2">Birthday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E7]">
              {filteredMembers.map((m) => (
                <tr
                  key={m.memberNumber}
                  onClick={isPrivileged ? () => setSelectedMember(m.memberNumber) : undefined}
                  className={
                    isPrivileged
                      ? `cursor-pointer ${selectedMember === m.memberNumber ? "bg-[#F6F0DF] ring-1 ring-[#BFA149]" : "hover:bg-gray-50"}`
                      : ""
                  }
                >
                  <td className="py-2 pr-4 font-medium text-[#032147]">{m.firstName} {m.lastName}</td>
                  <td className="py-2 pr-4 text-[#888888]">{m.email}</td>
                  <td className="py-2 pr-4 text-[#888888]">{m.phone}</td>
                  <td className="py-2 text-[#888888]">
                    {new Date(m.birthday).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isOfficer && (
          <div className="space-y-3 border-t border-[#E7E7E7] pt-4">
            {showEmailForm ? (
              <form onSubmit={handleSendEmail} className="max-w-md space-y-3">
                <label className="block text-sm font-medium text-[#032147]">
                  Message to All Members
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-3">
                  <button type="submit" className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white">
                    Send
                  </button>
                  <button type="button" onClick={() => setShowEmailForm(false)} className="rounded-md border border-[#D3D3D3] px-4 py-2 text-sm text-[#888888]">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white"
                >
                  Email Members
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-md border border-[#4169E1] px-4 py-2 text-sm font-semibold text-[#4169E1]"
                >
                  Download Members
                </button>
              </div>
            )}
          </div>
        )}

        {isPrivileged && (
          <div className="flex gap-3 border-t border-[#E7E7E7] pt-4">
            <button
              type="button"
              onClick={() => { setFormError(null); setFormMode("add"); }}
              className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setFormError(null); setFormMode("edit"); }}
              disabled={!selectedMember}
              className="rounded-md border border-[#4169E1] px-4 py-2 text-sm font-semibold text-[#4169E1] disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!selectedMember}
              className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991] disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}

        <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
          Back to Members Area
        </button>
      </section>
    </>
  );
}
