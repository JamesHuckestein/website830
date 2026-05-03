import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MeetingMinutes } from "@/components/MeetingMinutes";

describe("MeetingMinutes", () => {
  it("renders list of meeting minutes entries", () => {
    render(
      <MeetingMinutes
        detailId={null}
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    expect(screen.getByText("Council Business Meeting - April 2026")).toBeInTheDocument();
    expect(screen.getByText("Council Business Meeting - January 2026")).toBeInTheDocument();
  });

  it("calls onSelectMinute when an entry is clicked", () => {
    const onSelectMinute = vi.fn();
    render(
      <MeetingMinutes
        detailId={null}
        onSelectMinute={onSelectMinute}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Council Business Meeting - April 2026"));
    expect(onSelectMinute).toHaveBeenCalledWith("mm-001");
  });

  it("renders detail view when detailId is set", () => {
    render(
      <MeetingMinutes
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "Council Business Meeting - April 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Meeting Minutes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Members Area" })).toBeInTheDocument();
  });

  it("calls onBackToList from detail view", () => {
    const onBackToList = vi.fn();
    render(
      <MeetingMinutes
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={onBackToList}
        onBackToMembersArea={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to Meeting Minutes" }));
    expect(onBackToList).toHaveBeenCalled();
  });

  it("calls onBackToMembersArea from detail view", () => {
    const onBackToMembersArea = vi.fn();
    render(
      <MeetingMinutes
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={onBackToMembersArea}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBackToMembersArea).toHaveBeenCalled();
  });
});
