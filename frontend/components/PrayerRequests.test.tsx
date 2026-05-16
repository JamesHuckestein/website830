import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrayerRequests } from "@/components/PrayerRequests";

vi.mock("@/lib/api", () => ({
  getPrayerRequests: vi.fn().mockResolvedValue([
    { id: "pr-001", text: "Please pray for the healing of Tom Brady, who is recovering from surgery.", submittedBy: "8301004", submittedAt: "2026-04-28T10:15:00Z" },
  ]),
  createPrayerRequest: vi.fn().mockResolvedValue({ success: true, message: "Prayer request submitted." }),
}));

describe("PrayerRequests", () => {
  it("renders existing prayer requests", async () => {
    render(<PrayerRequests token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Tom Brady/)).toBeInTheDocument();
    });
  });

  it("shows success modal after submitting a prayer request", async () => {
    render(<PrayerRequests token="test-token" onBack={vi.fn()} />);
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
    render(<PrayerRequests token="test-token" onBack={vi.fn()} />);
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
    render(<PrayerRequests token="test-token" onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
