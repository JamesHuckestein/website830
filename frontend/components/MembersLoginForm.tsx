"use client";

import { useState } from "react";

type MembersLoginFormProps = {
  onLogin: (membershipNumber: string, passcode: string) => Promise<boolean>;
};

export function MembersLoginForm({ onLogin }: MembersLoginFormProps) {
  const [membershipNumber, setMembershipNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!membershipNumber || !passcode) {
      setError("Both membership number and passcode are required.");
      return;
    }

    const isValid = await onLogin(membershipNumber.trim(), passcode.trim());
    if (!isValid) {
      setError("Invalid membership number or passcode.");
      return;
    }

    setError("");
    setMembershipNumber("");
    setPasscode("");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Members Login</h2>
      <p className="text-sm text-[#888888]">
        Enter your membership number and passcode.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3">
        <label className="block text-sm font-medium text-[#032147]">
          Membership Number
          <input
            name="username"
            autoComplete="username"
            value={membershipNumber}
            onChange={(event) => setMembershipNumber(event.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          Passcode
          <input
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
        >
          Sign In
        </button>
      </form>
    </section>
  );
}
