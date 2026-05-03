import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NominationForm } from "@/components/NominationForm";

describe("NominationForm", () => {
  it("renders both input fields and Send button", () => {
    render(<NominationForm onBack={vi.fn()} />);
    expect(screen.getByLabelText("Knight of the Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Family of the Month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("clears fields after submit", () => {
    render(<NominationForm onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Knight of the Month"), { target: { value: "John Smith" } });
    fireEvent.change(screen.getByLabelText("Family of the Month"), { target: { value: "Smith Family" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByLabelText("Knight of the Month")).toHaveValue("");
    expect(screen.getByLabelText("Family of the Month")).toHaveValue("");
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<NominationForm onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
