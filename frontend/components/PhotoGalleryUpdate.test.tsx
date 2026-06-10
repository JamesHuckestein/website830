import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoGalleryUpdate } from "@/components/PhotoGalleryUpdate";
import * as api from "@/lib/api";
import type { Photo } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPhotos: vi.fn(),
  createPhoto: vi.fn(),
  updatePhoto: vi.fn(),
  deletePhoto: vi.fn(),
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
  vi.mocked(api.createPhoto).mockResolvedValue({
    success: true,
    message: "Photo added.",
    id: "new-1",
  });
  vi.mocked(api.updatePhoto).mockResolvedValue({ success: true, message: "Photo updated." });
  vi.mocked(api.deletePhoto).mockResolvedValue({ success: true, message: "Photo deleted." });
});

describe("PhotoGalleryUpdate", () => {
  it("fetches and renders all photo titles", async () => {
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    expect(screen.getByText("St. Patrick Day Service Project")).toBeInTheDocument();
  });

  it("highlights a row on click and only highlights one at a time", async () => {
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    const first = screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" });
    const second = screen.getByRole("button", { name: "Select photo St. Patrick Day Service Project" });

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the no-selection pop-up when Edit is clicked with nothing selected", async () => {
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Please select a photo first.")).toBeInTheDocument();
  });

  it("shows the no-selection pop-up when Delete is clicked with nothing selected", async () => {
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Please select a photo first.")).toBeInTheDocument();
  });

  it("Add saves via API, shows success modal, and refetches", async () => {
    vi.mocked(api.getPhotos)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([
        ...SEED,
        makePhoto({ id: "new-1", title: "Charity Drive", photoUrl: "/gallery/cd.jpg" }),
      ]);
    render(<PhotoGalleryUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Charity Drive" } });
    fireEvent.change(screen.getByLabelText("Upload Photo"), { target: { value: "/gallery/cd.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.createPhoto).toHaveBeenCalledWith("abc", {
        title: "Charity Drive",
        photoUrl: "/gallery/cd.jpg",
      });
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Photo added.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.getByText("Charity Drive")).toBeInTheDocument());
  });

  it("keeps the Add form open with values preserved when the backend returns an error", async () => {
    vi.mocked(api.createPhoto).mockRejectedValueOnce(
      new Error("Photo service is temporarily unavailable."),
    );
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Drafted Title" } });
    fireEvent.change(screen.getByLabelText("Upload Photo"), { target: { value: "/gallery/drafted.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
      expect(screen.getByText("Photo service is temporarily unavailable.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("heading", { name: "Add Photo" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Drafted Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("/gallery/drafted.jpg")).toBeInTheDocument();
  });

  it("Edit pre-fills the form and saves via API", async () => {
    vi.mocked(api.getPhotos)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([
        makePhoto({ id: "p1", title: "Renamed Dinner", photoUrl: "/gallery/a.jpg" }),
        SEED[1],
      ]);
    render(<PhotoGalleryUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByDisplayValue("Spring Charity Dinner 2026")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Renamed Dinner" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.updatePhoto).toHaveBeenCalledWith(
        "abc",
        "p1",
        expect.objectContaining({ title: "Renamed Dinner" }),
      );
      expect(screen.getByText("Photo updated.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => {
      expect(screen.queryByText("Spring Charity Dinner 2026")).toBeNull();
      expect(screen.getByText("Renamed Dinner")).toBeInTheDocument();
    });
  });

  it("Delete confirms via 'Confirm the delete?', calls API on confirm, refetches", async () => {
    vi.mocked(api.getPhotos)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([SEED[1]]);
    render(<PhotoGalleryUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("heading", { name: "Confirm the delete?" })).toBeInTheDocument();
    const dialog = screen.getByRole("heading", { name: "Confirm the delete?" }).parentElement as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(api.deletePhoto).toHaveBeenCalledWith("abc", "p1");
      expect(screen.getByText("Photo deleted.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText("Spring Charity Dinner 2026")).toBeNull());
  });

  it("Delete Cancel does not call the API", async () => {
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(api.deletePhoto).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Confirm the delete?" })).toBeNull();
    expect(screen.getByText("Spring Charity Dinner 2026")).toBeInTheDocument();
  });

  it("clears a stale selection when the selected row disappears from a refresh", async () => {
    vi.mocked(api.getPhotos)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([SEED[1]]);
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));

    fireEvent.click(screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" }));
    expect(
      screen.getByRole("button", { name: "Select photo Spring Charity Dinner 2026" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Trigger a refresh via Add (mutation type doesn't matter — the refetch is what we want)
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Upload Photo"), { target: { value: "/gallery/x.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    // After the refetch, the deleted row is gone AND the selection should have been cleared
    await waitFor(() => expect(screen.queryByText("Spring Charity Dinner 2026")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Please select a photo first.")).toBeInTheDocument();
  });

  it("calls onBack when Back to Members Area is clicked", async () => {
    const onBack = vi.fn();
    render(<PhotoGalleryUpdate token="t" onBack={onBack} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner 2026"));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders the empty-state when there are no photos", async () => {
    vi.mocked(api.getPhotos).mockResolvedValueOnce([]);
    render(<PhotoGalleryUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("No photos yet."));
  });
});
