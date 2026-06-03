"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getOfficers, type OfficerResponse } from "@/lib/api";

export function OfficersGrid() {
  const [officers, setOfficers] = useState<OfficerResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOfficers()
      .then((data) => {
        if (!cancelled) setOfficers(data);
      })
      .catch(() => {
        if (!cancelled) setOfficers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (officers === null) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#032147]">Officers</h2>
        <p className="text-sm text-[#888888]">Loading officers...</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Officers</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {officers.map((officer) => (
          <li
            key={officer.title}
            className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white"
          >
            <div className="flex justify-center bg-[#F5F5F5] p-2">
              <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
                <Image
                  src={officer.photoUrl}
                  alt={`${officer.name} - ${officer.title}`}
                  width={384}
                  height={512}
                  className="block h-36 w-auto max-w-full object-contain object-top"
                  sizes="(max-width: 640px) 42vw, 11rem"
                />
              </div>
            </div>
            <div className="space-y-1 p-3">
              <p className="font-semibold text-[#032147]">{officer.title}</p>
              <p className="text-sm text-[#888888]">{officer.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
