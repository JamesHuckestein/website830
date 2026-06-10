import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicPrayerRequests } from "@/components/PublicPrayerRequests";

vi.mock("@/lib/api", () => ({
  getPublicPrayerRequests: vi.fn().mockResolvedValue([
    { id: "pr-001", text: "Pray for the parish families.", submittedAt: "2026-04-28T10:15:00Z" },
    { id: "pr-002", text: "Healing for those in need.", submittedAt: "2026-04-20T08:00:00Z" },
  ]),
}));

describe("PublicPrayerRequests", () => {
  it("renders the prayer-section intro and Current Intentions list", async () => {
    render(<PublicPrayerRequests />);
    await waitFor(() => {
      expect(screen.getByText("Pray for the parish families.")).toBeInTheDocument();
      expect(screen.getByText("Healing for those in need.")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Prayer Requests" })).toBeInTheDocument();
    expect(screen.getByText("Current Intentions")).toBeInTheDocument();
  });

  it("does not render a submit form or any checkboxes", async () => {
    render(<PublicPrayerRequests />);
    await waitFor(() => screen.getByText("Pray for the parish families."));
    expect(screen.queryByPlaceholderText("Enter your prayer intention...")).toBeNull();
    expect(screen.queryByRole("button", { name: /Submit/i })).toBeNull();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /Delete/i })).toBeNull();
  });
});
