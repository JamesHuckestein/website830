import Image from "next/image";

import { councilInfo } from "@/data/siteData";

export function TopBanner() {
  return (
    <header className="border-b-4 border-[#BFA149] bg-[#4169E1] px-6 py-4 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <div className="relative h-12 w-40 shrink-0 sm:h-14 sm:w-48">
          <Image
            src="/kofc-logo.png"
            alt="Official Knights of Columbus logo featuring the K of C emblem and name."
            fill
            className="object-contain object-left"
            sizes="(max-width: 640px) 160px, 192px"
            priority
          />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{councilInfo.name}</h1>
          <p className="text-sm text-blue-100">
            {councilInfo.addressLines.map((line, index) => (
              <span key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
            <br />
            Phone: {councilInfo.phone}
          </p>
        </div>
      </div>
    </header>
  );
}
