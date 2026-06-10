import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrayerRequests } from "@/components/PrayerRequests";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPrayerRequests: vi.fn(),
  createPrayerRequest: vi.fn(),
  deletePrayerRequest: vi.fn(),
}));

const SEED = [
  { id: "pr-001", text: "Please pray for the healing of Tom Brady, who is recovering from surgery.", submittedBy: "8301004", submittedAt: "2026-04-28T10:15:00Z" },
  { id: "pr-002", text: "Prayers for the parish school staff.", submittedBy: "8301004", submittedAt: "2026-04-20T08:00:00Z" },
  { id: "pr-003", text: "Prayers for first responders.", submittedBy: "8301002", submittedAt: "2026-04-18T08:00:00Z" },
];

beforeEach(() => {
  vi.mocked(api.getPrayerRequests).mockResolvedValue(SEED);
  vi.mocked(api.createPrayerRequest).mockResolvedValue({ success: true, message: "Prayer request submitted." });
  vi.mocked(api.deletePrayerRequest).mockResolvedValue({ success: true, message: "Prayer request deleted." });
});

describe("PrayerRequests", () => {
  it("renders existing prayer requests", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Tom Brady/)).toBeInTheDocument();
    });
  });

  it("warns the submitter that intentions are publicly visible", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByPlaceholderText("Enter your prayer intention..."));
    expect(
      screen.getByText(/visible to all visitors of the public Prayer Requests page/i),
    ).toBeInTheDocument();
  });

  it("shows success modal after submitting a prayer request", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByPlaceholderText("Enter your prayer intention..."));
    fireEvent.change(screen.getByPlaceholderText("Enter your prayer intention..."), {
      target: { value: "Prayers for our community." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Prayer request submitted.")).toBeInTheDocument();
    });
  });

  it("dismisses the modal when Dismiss is clicked", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByPlaceholderText("Enter your prayer intention..."));
    fireEvent.change(screen.getByPlaceholderText("Enter your prayer intention..."), {
      target: { value: "A test prayer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("heading", { name: "Success" })).not.toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("only renders checkboxes for the logged-in member's own requests", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    // Two seed entries are owned by 8301004
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    // The other-owner row labels its submitter
    expect(screen.getByText(/submitted by 8301002/)).toBeInTheDocument();
  });

  it("renders a checkbox on every row when the logged-in member is an officer", async () => {
    // Officer 8301002 owns one of the three seed requests; should still see checkboxes on all
    render(<PrayerRequests token="test-token" memberNumber="8301002" isOfficer={true} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("disables Delete Selected until a checkbox is checked, then shows count", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    const deleteBtn = screen.getByRole("button", { name: /Delete Selected/ });
    expect(deleteBtn).toBeDisabled();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByRole("button", { name: "Delete Selected (1)" })).toBeEnabled();
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(screen.getByRole("button", { name: "Delete Selected (2)" })).toBeEnabled();
  });

  it("shows a confirmation dialog before deleting and Cancel aborts", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete Selected (1)" }));
    expect(screen.getByRole("heading", { name: "Delete prayer request(s)?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(api.deletePrayerRequest).not.toHaveBeenCalled();
  });

  it("deletes selected requests on confirm and shows success modal", async () => {
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Delete Selected (2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(api.deletePrayerRequest).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Deleted 2 prayer requests.")).toBeInTheDocument();
    });
  });

  it("reports partial failure when some deletes succeed and others fail", async () => {
    vi.mocked(api.deletePrayerRequest)
      .mockResolvedValueOnce({ success: true, message: "Prayer request deleted." })
      .mockRejectedValueOnce(new Error("API 403"));
    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Delete Selected (2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByText(/Deleted 1 of 2 prayer request\(s\); 1 could not be deleted\./)).toBeInTheDocument();
    });
  });

  it("refreshes the list after partial failure so successfully-deleted items disappear", async () => {
    // First fetch returns full seed; after delete attempt, refetch returns seed minus the succeeded item.
    vi.mocked(api.getPrayerRequests)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce(SEED.filter((r) => r.id !== "pr-001"));
    vi.mocked(api.deletePrayerRequest)
      .mockResolvedValueOnce({ success: true, message: "Prayer request deleted." }) // pr-001 succeeds
      .mockRejectedValueOnce(new Error("API 500")); // pr-002 fails

    render(<PrayerRequests token="test-token" memberNumber="8301004" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText(/Tom Brady/));
    fireEvent.click(screen.getAllByRole("checkbox")[0]); // pr-001 (Tom Brady)
    fireEvent.click(screen.getAllByRole("checkbox")[1]); // pr-002 (parish school staff)
    fireEvent.click(screen.getByRole("button", { name: "Delete Selected (2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      // The error modal appears AND the underlying list has already refetched without Tom Brady
      expect(screen.getByText(/Deleted 1 of 2/)).toBeInTheDocument();
      expect(screen.queryByText(/Tom Brady/)).not.toBeInTheDocument();
      expect(screen.getByText(/parish school staff/)).toBeInTheDocument();
    });
  });
});
