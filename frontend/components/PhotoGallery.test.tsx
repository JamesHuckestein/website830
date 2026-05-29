import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoGallery } from "@/components/PhotoGallery";
import * as api from "@/lib/api";
import type { Photo } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPhotos: vi.fn(),
}));

function makePhoto(overrides: Partial<Photo>): Photo {
  return {
    id: "p1",
    title: "Sample",
    photoUrl: "/gallery/sample.jpg",
    createdBy: "8301002",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

const SEED: Photo[] = [
  makePhoto({ id: "p1", title: "Spring Charity Dinner 2026", photoUrl: "/gallery/a.jpg" }),
  makePhoto({ id: "p2", title: "St. Patrick Day Service Project", photoUrl: "/gallery/b.jpg" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getPhotos).mockResolvedValue(SEED);
});

describe("PhotoGallery", () => {
  it("renders each photo title from the API response", async () => {
    render(<PhotoGallery />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    expect(screen.getByText("St. Patrick Day Service Project")).toBeInTheDocument();
  });

  it("renders each photo's image with the title as alt text", async () => {
    render(<PhotoGallery />);
    await waitFor(() => screen.getByAltText("Spring Charity Dinner 2026"));
    expect(screen.getByAltText("St. Patrick Day Service Project")).toBeInTheDocument();
  });

  it("preserves the order returned by the API (oldest first, newest at the bottom)", async () => {
    render(<PhotoGallery />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    const titles = screen.getAllByText(/Spring Charity Dinner 2026|St\. Patrick Day Service Project/);
    expect(titles.map((el) => el.textContent)).toEqual([
      "Spring Charity Dinner 2026",
      "St. Patrick Day Service Project",
    ]);
  });

  it("shows a Loading placeholder before the first fetch resolves", () => {
    vi.mocked(api.getPhotos).mockReturnValue(new Promise(() => {})); // never resolves
    render(<PhotoGallery />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows an empty-state message when the list is empty", async () => {
    vi.mocked(api.getPhotos).mockResolvedValueOnce([]);
    render(<PhotoGallery />);
    await waitFor(() => screen.getByText("No photos yet."));
  });

  it("falls back to an empty grid when the API call fails", async () => {
    vi.mocked(api.getPhotos).mockRejectedValueOnce(new Error("network"));
    render(<PhotoGallery />);
    await waitFor(() => screen.getByText("No photos yet."));
  });
});
