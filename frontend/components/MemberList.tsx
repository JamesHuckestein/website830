"use client";

import { useState } from "react";

import { dummyMembers } from "@/data/siteData";

type MemberListProps = {
  isOfficer: boolean;
  onBack: () => void;
};

function membersToCSV(): string {
  const headers = ["Member Number", "First Name", "Last Name", "Email", "Phone", "Birthday", "Officer Position", "Assembly Number"];
  const rows = dummyMembers.map((m) => [
    m.memberNumber, m.firstName, m.lastName, m.email, m.phone, m.birthday,
    m.officerPosition ?? "", m.assemblyNumber ?? "",
  ]);
  return [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
}

export function MemberList({ isOfficer, onBack }: MemberListProps) {
  const [emailMessage, setEmailMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleDownload = () => {
    const csv = membersToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "koc-830-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage("");
    setShowEmailForm(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Member List</h2>
      <div className="overflow-x-auto">
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
            {dummyMembers.map((m) => (
              <tr key={m.memberNumber}>
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
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
