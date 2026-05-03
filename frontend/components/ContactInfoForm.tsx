"use client";

import { useState } from "react";

import { dummyMembers } from "@/data/siteData";

type ContactInfoFormProps = {
  memberNumber: string;
  onBack: () => void;
};

export function ContactInfoForm({ memberNumber, onBack }: ContactInfoFormProps) {
  const member = dummyMembers.find((m) => m.memberNumber === memberNumber) ?? dummyMembers[0];

  const [address, setAddress] = useState(member.address);
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Contact Information</h2>
      <p className="text-sm text-[#888888]">
        {member.firstName} {member.lastName} — Member #{member.memberNumber}
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3">
        <label className="block text-sm font-medium text-[#032147]">
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
        >
          Save
        </button>
      </form>
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
