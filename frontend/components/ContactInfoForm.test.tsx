import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactInfoForm } from "@/components/ContactInfoForm";

describe("ContactInfoForm", () => {
  it("pre-fills fields from the matching dummy member", () => {
    render(<ContactInfoForm memberNumber="8301001" onBack={vi.fn()} />);
    expect(screen.getByDisplayValue("123 Oak St, Denison, TX 75020")).toBeInTheDocument();
    expect(screen.getByDisplayValue("903-555-0101")).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<ContactInfoForm memberNumber="8301001" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
