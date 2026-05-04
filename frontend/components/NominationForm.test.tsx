import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NominationForm } from "@/components/NominationForm";

vi.mock("@/lib/api", () => ({
  submitNomination: vi.fn().mockResolvedValue(undefined),
}));

describe("NominationForm", () => {
  it("renders both input fields and Send button", () => {
    render(<NominationForm token="test-token" onBack={vi.fn()} />);
    expect(screen.getByLabelText("Knight of the Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Family of the Month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("clears fields after submit", async () => {
    render(<NominationForm token="test-token" onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Knight of the Month"), { target: { value: "John Smith" } });
    fireEvent.change(screen.getByLabelText("Family of the Month"), { target: { value: "Smith Family" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Knight of the Month")).toHaveValue("");
      expect(screen.getByLabelText("Family of the Month")).toHaveValue("");
    });
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<NominationForm token="test-token" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
