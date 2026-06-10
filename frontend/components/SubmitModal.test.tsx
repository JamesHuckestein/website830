import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubmitModal } from "@/components/SubmitModal";

describe("SubmitModal", () => {
  it("shows Success heading and message for success=true", () => {
    render(<SubmitModal success={true} message="Contact information updated." onDismiss={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
    expect(screen.getByText("Contact information updated.")).toBeInTheDocument();
  });

  it("shows Error heading for success=false", () => {
    render(<SubmitModal success={false} message="Something went wrong." onDismiss={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("calls onDismiss when Dismiss is clicked", () => {
    const onDismiss = vi.fn();
    render(<SubmitModal success={true} message="Done." onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
