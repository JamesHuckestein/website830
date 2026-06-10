import Image from "next/image";

import type { Photo } from "@/lib/api";

type PhotoCardProps = {
  photo: Photo;
};

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <div className="overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
      <div className="flex justify-center bg-[#F5F5F5] p-2">
        <div className="rounded-md border border-[#E0E0E0] bg-white p-1">
          <Image
            src={photo.photoUrl}
            alt={photo.title}
            width={384}
            height={512}
            className="block h-36 w-auto max-w-full object-contain object-top"
            sizes="(max-width: 640px) 42vw, 11rem"
          />
        </div>
      </div>
      <div className="space-y-1 p-3">
        <p className="font-semibold text-[#032147]">{photo.title}</p>
      </div>
    </div>
  );
}
