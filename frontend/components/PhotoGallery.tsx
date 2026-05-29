"use client";

import { useEffect, useState } from "react";

import { PhotoCard } from "@/components/PhotoCard";
import { getPhotos, type Photo } from "@/lib/api";

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPhotos()
      .then((data) => {
        if (!cancelled) setPhotos(data);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#032147]">Photo Galleries</h2>
      {photos === null ? (
        <p className="text-sm text-[#888888]">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-[#888888]">No photos yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {photos.map((p) => (
            <li key={p.id}>
              <PhotoCard photo={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
