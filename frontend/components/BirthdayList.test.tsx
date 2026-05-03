import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BirthdayList } from "@/components/BirthdayList";

describe("BirthdayList", () => {
  it("renders the heading", () => {
    render(<BirthdayList onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Upcoming Birthdays" })).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<BirthdayList onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
