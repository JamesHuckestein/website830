"use client";

import { useEffect, useRef, useState } from "react";

import { getMembers, grantAuxiliaryOfficer, revokeAuxiliaryOfficer, type MemberResponse } from "@/lib/api";
import { SubmitModal } from "@/components/SubmitModal";

const ADMIN_MEMBER_NUMBER = "830999999";

type AuxOfficerPrivilegesProps = {
  token: string;
  onBack: () => void;
};

export function AuxOfficerPrivileges({ token, onBack }: AuxOfficerPrivilegesProps) {
  const [members, setMembers] = useState<MemberResponse[] | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [filterText, setFilterText] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
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
    return () => { cancelled = true; };
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

  const eligibleMembers = members
    ? members.filter((m) => m.officerPosition === null && m.memberNumber !== ADMIN_MEMBER_NUMBER)
    : [];

  const filteredMembers = eligibleMembers.filter((m) => {
    const name = `${m.lastName}, ${m.firstName}`.toLowerCase();
    return name.includes(filterText.toLowerCase());
  });

  const selected = eligibleMembers.find((m) => m.memberNumber === selectedMember) ?? null;

  const selectedMemberName = selected ? `${selected.lastName}, ${selected.firstName}` : "";

  const canGrant = selected !== null && !selected.isAuxiliaryOfficer && !submitting;
  const canDeny = selected !== null && selected.isAuxiliaryOfficer && !submitting;

  const handleGrant = async () => {
    if (!canGrant) return;
    setSubmitting(true);
    try {
      const result = await grantAuxiliaryOfficer(token, selectedMember);
      setFeedback({ success: true, message: result.message });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to grant privileges.";
      setFeedback({ success: false, message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!canDeny) return;
    setSubmitting(true);
    try {
      const result = await revokeAuxiliaryOfficer(token, selectedMember);
      setFeedback({ success: true, message: result.message });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke privileges.";
      setFeedback({ success: false, message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setFeedback(null);
    setSelectedMember("");
    setFilterText("");
    if (members) {
      let cancelled = false;
      getMembers(token)
        .then((data) => { if (!cancelled) setMembers(data); })
        .catch(() => { if (!cancelled) setMembers([]); });
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#032147]">Auxiliary Officer Privileges</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-[#753991] px-3 py-1 text-sm font-semibold text-[#753991]"
        >
          Back
        </button>
      </div>

      <p className="text-sm text-[#032147]">
        This menu allows the officers to grant elevated privileges to members with appointed positions on the website.
      </p>

      <div className="space-y-4">
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGrant}
            disabled={!canGrant}
            className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Grant
          </button>
          <button
            type="button"
            onClick={handleDeny}
            disabled={!canDeny}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-[#888888] px-4 py-2 text-sm font-semibold text-[#888888]"
          >
            Cancel
          </button>
        </div>
      </div>

      {feedback !== null && (
        <SubmitModal
          success={feedback.success}
          message={feedback.message}
          onDismiss={handleDismiss}
        />
      )}
    </section>
  );
}
