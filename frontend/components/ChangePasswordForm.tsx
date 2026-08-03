"use client";

import { useState } from "react";

import { SubmitModal } from "@/components/SubmitModal";
import { changePassword } from "@/lib/api";

type ChangePasswordFormProps = {
  token: string;
  onBack: () => void;
};

export function ChangePasswordForm({ token, onBack }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await changePassword(token, currentPassword, newPassword);
      setModal(result);
      if (result.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setModal({ success: false, message: "Failed to change password." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#032147]">Change Password</h2>
        <button
          onClick={onBack}
          className="rounded-md border border-[#888888] px-3 py-1 text-sm font-semibold text-[#032147]"
        >
          Back
        </button>
      </div>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-1">
          <label htmlFor="current-password" className="block text-sm font-medium text-[#032147]">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
            disabled={submitting}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="new-password" className="block text-sm font-medium text-[#032147]">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
            disabled={submitting}
          />
          <p className="text-xs text-[#888888]">Minimum 8 characters, must include uppercase, lowercase, and a number.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-[#032147]">
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
            disabled={submitting}
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Change Password"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-md border border-[#888888] px-4 py-2 text-sm font-semibold text-[#032147] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={() => setModal(null)} />}
    </section>
  );
}
