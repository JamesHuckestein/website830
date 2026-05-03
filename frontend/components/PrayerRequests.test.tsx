import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrayerRequests } from "@/components/PrayerRequests";

describe("PrayerRequests", () => {
  it("renders existing dummy prayer requests", () => {
    render(<PrayerRequests onBack={vi.fn()} />);
    expect(screen.getByText(/Tom Brady/)).toBeInTheDocument();
  });

  it("adds a new prayer request on submit", () => {
    render(<PrayerRequests onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Enter your prayer intention..."), {
      target: { value: "Prayers for our community." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText("Prayers for our community.")).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<PrayerRequests onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
