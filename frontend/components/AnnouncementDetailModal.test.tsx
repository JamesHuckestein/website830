import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnouncementDetailModal } from "@/components/AnnouncementDetailModal";
import type { Announcement } from "@/lib/api";

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: "a1",
    title: "Spring Charity Dinner",
    details: "Join us for our spring charity dinner.",
    deleteDate: "2026-05-31",
    createdBy: "8301002",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("AnnouncementDetailModal", () => {
  it("renders the title and details", () => {
    render(<AnnouncementDetailModal announcement={makeAnnouncement()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Spring Charity Dinner" })).toBeInTheDocument();
    expect(screen.getByText("Join us for our spring charity dinner.")).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = vi.fn();
    render(<AnnouncementDetailModal announcement={makeAnnouncement()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("preserves multi-line details via whitespace-pre-line", () => {
    render(
      <AnnouncementDetailModal
        announcement={makeAnnouncement({ details: "Line one.\nLine two." })}
        onClose={vi.fn()}
      />,
    );
    const body = screen.getByText("Line one. Line two.");
    expect(body.className).toContain("whitespace-pre-line");
  });
});
