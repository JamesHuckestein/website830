"use client";

import { useState } from "react";

import { SubmitModal } from "@/components/SubmitModal";
import { updateAdminPassword } from "@/lib/api";

type AdminPasswordFormProps = {
  token: string;
  onBack: () => void;
};

export function AdminPasswordForm({ token, onBack }: AdminPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length === 0) {
      setError("Password is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateAdminPassword(token, password);
      setModal(result);
      if (result.success) {
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setModal({ success: false, message: "Failed to update password." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#032147]">Change Admin Password</h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-1">
          <label htmlFor="new-password" className="block text-sm font-medium text-[#032147]">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[#888888] px-3 py-2 text-sm"
            disabled={submitting}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-[#032147]">
            Confirm Password
          </label>
          <input
            id="confirm-password"
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
            {submitting ? "Saving..." : "Save"}
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
