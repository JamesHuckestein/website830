import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeCarousel } from "@/components/HomeCarousel";
import { officers } from "@/data/siteData";

describe("HomeCarousel", () => {
  it("auto-advances through officers", () => {
    vi.useFakeTimers();
    render(<HomeCarousel officers={officers} onOpenOfficers={vi.fn()} />);

    expect(screen.getByText("SK John H Akers")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("SK James Huckestein")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
