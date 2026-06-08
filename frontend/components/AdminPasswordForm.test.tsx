import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPasswordForm } from "@/components/AdminPasswordForm";

vi.mock("@/lib/api", () => ({
  updateAdminPassword: vi.fn().mockResolvedValue({ success: true, message: "Password updated successfully." }),
}));

describe("AdminPasswordForm", () => {
  it("renders password fields and buttons", () => {
    render(<AdminPasswordForm token="test-token" onBack={vi.fn()} />);
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    render(<AdminPasswordForm token="test-token" onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "xyz789" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("shows error when password is empty", async () => {
    render(<AdminPasswordForm token="test-token" onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("calls API and shows success modal on valid submit", async () => {
    render(<AdminPasswordForm token="test-token" onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewPass1!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "NewPass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Password updated successfully.")).toBeInTheDocument();
    });
  });

  it("calls onBack when Cancel is clicked", () => {
    const onBack = vi.fn();
    render(<AdminPasswordForm token="test-token" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onBack).toHaveBeenCalled();
  });
});
