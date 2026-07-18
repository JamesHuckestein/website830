"use client";

import { useState } from "react";

import type { MemberFormData, MemberResponse } from "@/lib/api";

type MemberFormModalProps = {
  mode: "add" | "edit";
  member: MemberResponse | null;
  submitting: boolean;
  error: string | null;
  onSave: (data: MemberFormData) => void;
  onCancel: () => void;
};

export function MemberFormModal({ mode, member, submitting, error, onSave, onCancel }: MemberFormModalProps) {
  const [memberNumber, setMemberNumber] = useState(member?.memberNumber ?? "");
  const [passcode, setPasscode] = useState("");
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [addressStreet, setAddressStreet] = useState(member?.addressStreet ?? "");
  const [addressCity, setAddressCity] = useState(member?.addressCity ?? "");
  const [addressState, setAddressState] = useState(member?.addressState ?? "");
  const [addressZip, setAddressZip] = useState(member?.addressZip ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [birthday, setBirthday] = useState(member?.birthday ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [assemblyNumber, setAssemblyNumber] = useState(member?.assemblyNumber ?? "");
  const [firstDegreeDate, setFirstDegreeDate] = useState(member?.firstDegreeDate ?? "");
  const [secondDegreeDate, setSecondDegreeDate] = useState(member?.secondDegreeDate ?? "");
  const [thirdDegreeDate, setThirdDegreeDate] = useState(member?.thirdDegreeDate ?? "");
  const [fourthDegreeDate, setFourthDegreeDate] = useState(member?.fourthDegreeDate ?? "");

  const isValidPassword = (pw: string) =>
    pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);

  const passwordProvided = passcode.trim() !== "";
  const passwordValid = !passwordProvided || isValidPassword(passcode.trim());

  const requiredFilled =
    memberNumber.trim() !== "" &&
    (mode === "edit" || passwordProvided) &&
    passwordValid &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    birthday !== "" &&
    firstDegreeDate !== "" &&
    secondDegreeDate !== "" &&
    thirdDegreeDate !== "";

  const canSave = requiredFilled && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      memberNumber: memberNumber.trim(),
      passcode: passcode.trim() || null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      addressStreet: addressStreet.trim(),
      addressCity: addressCity.trim(),
      addressState: addressState.trim(),
      addressZip: addressZip.trim(),
      phone: phone.trim(),
      birthday,
      email: email.trim(),
      assemblyNumber: assemblyNumber.trim() || null,
      firstDegreeDate,
      secondDegreeDate,
      thirdDegreeDate,
      fourthDegreeDate: fourthDegreeDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-[#032147]">
          {mode === "add" ? "Add Member" : "Edit Member"}
        </h2>
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
          <Field name="mnum" label="Member Number *" value={memberNumber} onChange={setMemberNumber} disabled={mode === "edit"} placeholder="Member ID" />
          <Field name="mpass" label={mode === "add" ? "Password *" : "Password"} value={passcode} onChange={setPasscode} placeholder={mode === "edit" ? "Leave blank for no change" : ""} />
          <p className="text-xs text-[#888888]">Minimum 8 characters, must include uppercase, lowercase, and a number.</p>
          {passwordProvided && !passwordValid && (
            <p className="text-xs text-red-700">Password does not meet requirements.</p>
          )}
          <Field name="fname" label="First Name *" value={firstName} onChange={setFirstName} />
          <Field name="lname" label="Last Name *" value={lastName} onChange={setLastName} />
          <Field name="mstreet" label="Street Address" value={addressStreet} onChange={setAddressStreet} />
          <Field name="mcity" label="City" value={addressCity} onChange={setAddressCity} />
          <Field name="mst" label="State" value={addressState} onChange={setAddressState} maxLength={2} />
          <Field name="mzip" label="Zip Code" value={addressZip} onChange={setAddressZip} />
          <Field name="mphone" label="Phone" value={phone} onChange={setPhone} />
          <DateField name="mbday" label="Birthday *" value={birthday} onChange={setBirthday} />
          <Field name="memail" label="Email" value={email} onChange={setEmail} />
          <Field name="massembly" label="Assembly Number" value={assemblyNumber} onChange={setAssemblyNumber} />
          <DateField name="deg1" label="1st Degree Date *" value={firstDegreeDate} onChange={setFirstDegreeDate} />
          <DateField name="deg2" label="2nd Degree Date *" value={secondDegreeDate} onChange={setSecondDegreeDate} />
          <DateField name="deg3" label="3rd Degree Date *" value={thirdDegreeDate} onChange={setThirdDegreeDate} />
          <DateField name="deg4" label="4th Degree Date" value={fourthDegreeDate} onChange={setFourthDegreeDate} />

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={!canSave}
              className="rounded-md bg-[#4169E1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-md border border-[#753991] px-4 py-2 text-sm font-semibold text-[#753991] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, disabled, placeholder, maxLength }: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-medium text-[#032147]">
      {label}
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="one-time-code"
        className="mt-1 w-full rounded-md border border-[#E7E7E7] px-3 py-2 text-sm text-[#032147] disabled:bg-gray-100 focus:border-[#4169E1] focus:outline-none"
      />
    </label>
  );
}

function DateField({ label, name, value, onChange }: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-[#032147]">
      {label}
      <input
        type="date"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="one-time-code"
        className="mt-1 w-full rounded-md border border-[#E7E7E7] px-3 py-2 text-sm text-[#032147] focus:border-[#4169E1] focus:outline-none"
      />
    </label>
  );
}
