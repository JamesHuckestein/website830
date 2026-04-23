"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { Officer } from "@/data/siteData";

type HomeCarouselProps = {
  officers: Officer[];
  onOpenOfficers: () => void;
};

export function HomeCarousel({ officers, onOpenOfficers }: HomeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = officers.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => clearInterval(timer);
  }, [total]);

  const officer = useMemo(() => officers[currentIndex], [officers, currentIndex]);

  const movePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const moveNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <section aria-label="Home officers carousel" className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">
        Council 830 Leadership
      </h2>
      <p className="text-sm text-[#888888]">
        Rotating display of our 14 council officers.
      </p>
      <button
        type="button"
        onClick={onOpenOfficers}
        className="inline-flex max-w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-[#E7E7E7] bg-white text-left transition hover:border-[#4169E1] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]"
        aria-label="View full officers list"
      >
        <div className="flex justify-start bg-[#F5F5F5] p-2">
          <div className="w-fit max-w-full rounded-md border border-[#E0E0E0] bg-white p-1">
            <Image
              src={officer.imageUrl}
              alt=""
              width={384}
              height={512}
              className="block object-contain object-top"
              style={{ height: "16.5rem", width: "auto", maxWidth: "100%" }}
              sizes="(max-width: 640px) 85vw, 16rem"
              priority={currentIndex === 0}
              aria-hidden
            />
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-lg font-semibold text-[#032147]">{officer.name}</p>
          <p className="text-sm text-[#888888]">{officer.title}</p>
        </div>
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md border border-[#BFA149] px-4 py-2 text-sm font-semibold text-[#032147]"
          onClick={movePrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white"
          onClick={moveNext}
        >
          Next
        </button>
      </div>
    </section>
  );
}
