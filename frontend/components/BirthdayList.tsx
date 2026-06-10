"use client";

import { useEffect, useState } from "react";

import { getBirthdays, type MemberResponse } from "@/lib/api";

type BirthdayListProps = {
  token: string;
  onBack: () => void;
};

export function BirthdayList({ token, onBack }: BirthdayListProps) {
  const [members, setMembers] = useState<MemberResponse[] | null>(null);

  useEffect(() => {
    getBirthdays(token).then(setMembers).catch(() => setMembers([]));
  }, [token]);

  if (!members) {
    return <p className="text-sm text-[#888888]">Loading...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Upcoming Birthdays</h2>
      <p className="text-sm text-[#888888]">Members with birthdays in the next 30 days.</p>
      {members.length === 0 ? (
        <p className="text-sm text-[#888888]">No birthdays in the next 30 days.</p>
      ) : (
        <ul className="divide-y divide-[#E7E7E7]">
          {members.map((m) => {
            const bday = new Date(m.birthday);
            const formatted = bday.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            return (
              <li key={m.memberNumber} className="flex justify-between py-2 text-sm">
                <span className="font-medium text-[#032147]">{m.firstName} {m.lastName}</span>
                <span className="text-[#888888]">{formatted}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={onBack} className="text-sm text-[#4169E1] underline">
        Back to Members Area
      </button>
    </section>
  );
}
