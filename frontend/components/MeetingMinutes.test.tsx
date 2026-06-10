import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MeetingMinutes } from "@/components/MeetingMinutes";

vi.mock("@/lib/api", () => ({
  getMeetingMinutes: vi.fn().mockResolvedValue([
    { id: "mm-001", title: "Council Business Meeting - April 2026", meetingDate: "2026-04-02", s3Key: "key1" },
    { id: "mm-002", title: "Council Business Meeting - January 2026", meetingDate: "2026-01-08", s3Key: "key2" },
  ]),
  getMeetingMinutesDetail: vi.fn().mockResolvedValue({
    id: "mm-001",
    title: "Council Business Meeting - April 2026",
    meetingDate: "2026-04-02",
    url: "s3://key1",
  }),
}));

describe("MeetingMinutes", () => {
  it("renders list of meeting minutes entries", async () => {
    render(
      <MeetingMinutes
        token="test-token"
        detailId={null}
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByText("Council Business Meeting - April 2026")).toBeInTheDocument();
      expect(screen.getByText("Council Business Meeting - January 2026")).toBeInTheDocument();
    });
  });

  it("calls onSelectMinute when an entry is clicked", async () => {
    const onSelectMinute = vi.fn();
    render(
      <MeetingMinutes
        token="test-token"
        detailId={null}
        onSelectMinute={onSelectMinute}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    await waitFor(() => screen.getByText("Council Business Meeting - April 2026"));
    fireEvent.click(screen.getByText("Council Business Meeting - April 2026"));
    expect(onSelectMinute).toHaveBeenCalledWith("mm-001");
  });

  it("renders detail view when detailId is set", async () => {
    render(
      <MeetingMinutes
        token="test-token"
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Council Business Meeting - April 2026" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to Meeting Minutes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to Members Area" })).toBeInTheDocument();
    });
  });

  it("calls onBackToList from detail view", async () => {
    const onBackToList = vi.fn();
    render(
      <MeetingMinutes
        token="test-token"
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={onBackToList}
        onBackToMembersArea={vi.fn()}
      />
    );
    await waitFor(() => screen.getByRole("button", { name: "Back to Meeting Minutes" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Meeting Minutes" }));
    expect(onBackToList).toHaveBeenCalled();
  });

  it("calls onBackToMembersArea from detail view", async () => {
    const onBackToMembersArea = vi.fn();
    render(
      <MeetingMinutes
        token="test-token"
        detailId="mm-001"
        onSelectMinute={vi.fn()}
        onBackToList={vi.fn()}
        onBackToMembersArea={onBackToMembersArea}
      />
    );
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBackToMembersArea).toHaveBeenCalled();
  });
});
