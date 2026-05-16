"use client";

import { useEffect, useState } from "react";

import { getMember, updateMember, type MemberResponse } from "@/lib/api";
import { SubmitModal } from "@/components/SubmitModal";

type ContactInfoFormProps = {
  token: string;
  memberNumber: string;
  onBack: () => void;
};

export function ContactInfoForm({ token, memberNumber, onBack }: ContactInfoFormProps) {
  const [member, setMember] = useState<MemberResponse | null>(null);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [modal, setModal] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    getMember(token, memberNumber).then((m) => {
      setMember(m);
      setAddressStreet(m.addressStreet);
      setAddressCity(m.addressCity);
      setAddressState(m.addressState);
      setAddressZip(m.addressZip);
      setPhone(m.phone);
      setEmail(m.email);
    }).catch(() => {});
  }, [token, memberNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateMember(token, memberNumber, { addressStreet, addressCity, addressState, addressZip, phone, email });
      setModal({ success: true, message: result.message });
    } catch {
      setModal({ success: false, message: "Failed to update contact information. Please try again." });
    }
  };

  if (!member) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <>
      {modal && <SubmitModal success={modal.success} message={modal.message} onDismiss={() => setModal(null)} />}
      <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Contact Information</h2>
      <p className="text-sm text-[#888888]">
        {member.firstName} {member.lastName} — Member #{member.memberNumber}
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3">
        <label className="block text-sm font-medium text-[#032147]">
          Street
          <input
            value={addressStreet}
            onChange={(e) => setAddressStreet(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          City
          <input
            value={addressCity}
            onChange={(e) => setAddressCity(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          State
          <input
            value={addressState}
            onChange={(e) => setAddressState(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#D3D3D3] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-[#032147]">
          Zip
          <input
            value={addressZip}
            onChange={(e) => setAddressZip(e.target.value)}
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
    </>
  );
}
