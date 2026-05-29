import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnnouncementsUpdate } from "@/components/AnnouncementsUpdate";
import * as api from "@/lib/api";
import type { Announcement } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getAnnouncements: vi.fn(),
  createAnnouncement: vi.fn(),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

function makeAnnouncement(overrides: Partial<Announcement>): Announcement {
  return {
    id: "a1",
    title: "Sample",
    details: "Sample details.",
    deleteDate: "2026-12-31",
    createdBy: "8301002",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

const SEED: Announcement[] = [
  makeAnnouncement({ id: "a1", title: "Spring Charity Dinner", details: "Dinner details." }),
  makeAnnouncement({ id: "a2", title: "Volunteer Sign-Up", details: "Volunteer details." }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getAnnouncements).mockResolvedValue(SEED);
  vi.mocked(api.createAnnouncement).mockResolvedValue({
    success: true,
    message: "Announcement created.",
    id: "new-1",
  });
  vi.mocked(api.updateAnnouncement).mockResolvedValue({ success: true, message: "Announcement updated." });
  vi.mocked(api.deleteAnnouncement).mockResolvedValue({ success: true, message: "Announcement deleted." });
});

describe("AnnouncementsUpdate", () => {
  it("fetches and renders all announcement titles", async () => {
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    expect(screen.getByText("Volunteer Sign-Up")).toBeInTheDocument();
  });

  it("highlights a row on click and only highlights one at a time", async () => {
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    const first = screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" });
    const second = screen.getByRole("button", { name: "Select announcement Volunteer Sign-Up" });

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the no-selection pop-up when Edit is clicked with nothing selected", async () => {
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Please select an announcement first.")).toBeInTheDocument();
  });

  it("shows the no-selection pop-up when Delete is clicked with nothing selected", async () => {
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Please select an announcement first.")).toBeInTheDocument();
  });

  it("Add saves via API, shows success modal, and refetches", async () => {
    vi.mocked(api.getAnnouncements)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([
        makeAnnouncement({ id: "new-1", title: "Charity Drive", details: "Service." }),
        ...SEED,
      ]);
    render(<AnnouncementsUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Charity Drive" } });
    fireEvent.change(screen.getByLabelText("Announcement Details"), { target: { value: "Service." } });
    fireEvent.change(screen.getByLabelText("Date to Delete"), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.createAnnouncement).toHaveBeenCalledWith("abc", {
        title: "Charity Drive",
        details: "Service.",
        deleteDate: "2026-12-31",
      });
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Announcement created.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.getByText("Charity Drive")).toBeInTheDocument());
  });

  it("keeps the Add form open with values preserved when the backend returns an error", async () => {
    vi.mocked(api.createAnnouncement).mockRejectedValueOnce(
      new Error("Server is temporarily unavailable."),
    );
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Drafted" } });
    fireEvent.change(screen.getByLabelText("Announcement Details"), { target: { value: "Drafted body." } });
    fireEvent.change(screen.getByLabelText("Date to Delete"), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
      expect(screen.getByText("Server is temporarily unavailable.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("heading", { name: "Add Announcement" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Drafted")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Drafted body.")).toBeInTheDocument();
  });

  it("Edit pre-fills the form and saves via API", async () => {
    vi.mocked(api.getAnnouncements)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([
        makeAnnouncement({ id: "a1", title: "Renamed", details: "Dinner details." }),
        SEED[1],
      ]);
    render(<AnnouncementsUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByDisplayValue("Spring Charity Dinner")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.updateAnnouncement).toHaveBeenCalledWith(
        "abc",
        "a1",
        expect.objectContaining({ title: "Renamed" }),
      );
      expect(screen.getByText("Announcement updated.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => {
      expect(screen.queryByText("Spring Charity Dinner")).toBeNull();
      expect(screen.getByText("Renamed")).toBeInTheDocument();
    });
  });

  it("Delete confirms via 'Confirm the delete?', calls API on confirm, refetches", async () => {
    vi.mocked(api.getAnnouncements)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([SEED[1]]);
    render(<AnnouncementsUpdate token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("heading", { name: "Confirm the delete?" })).toBeInTheDocument();
    const dialog = screen.getByRole("heading", { name: "Confirm the delete?" }).parentElement as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(api.deleteAnnouncement).toHaveBeenCalledWith("abc", "a1");
      expect(screen.getByText("Announcement deleted.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText("Spring Charity Dinner")).toBeNull());
  });

  it("Delete Cancel does not call the API", async () => {
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(api.deleteAnnouncement).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Confirm the delete?" })).toBeNull();
    expect(screen.getByText("Spring Charity Dinner")).toBeInTheDocument();
  });

  it("clears a stale selection when the selected row disappears from a refresh", async () => {
    // Initial fetch has both seeds; the refresh after Add returns a list without `a1`
    // (simulates another officer deleting it concurrently — or the row expiring).
    vi.mocked(api.getAnnouncements)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([SEED[1]]);
    render(<AnnouncementsUpdate token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));

    fireEvent.click(screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" }));
    expect(
      screen.getByRole("button", { name: "Select announcement Spring Charity Dinner" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Trigger a refresh via Add (mutation type doesn't matter — the refetch is what we want)
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Announcement Details"), { target: { value: "Y" } });
    fireEvent.change(screen.getByLabelText("Date to Delete"), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    // After the refetch, the deleted row is gone AND the selection should have been cleared
    await waitFor(() => expect(screen.queryByText("Spring Charity Dinner")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Please select an announcement first.")).toBeInTheDocument();
  });

  it("calls onBack when Back to Members Area is clicked", async () => {
    const onBack = vi.fn();
    render(<AnnouncementsUpdate token="t" onBack={onBack} />);
    await waitFor(() => screen.getByText("Spring Charity Dinner"));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
