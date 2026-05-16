import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OfficerContacts } from "@/components/OfficerContacts";

vi.mock("@/lib/api", () => ({
  emailOfficer: vi.fn().mockResolvedValue({ success: true, message: "Your message has been sent." }),
}));

describe("OfficerContacts", () => {
  it("renders all 14 officer Send Email buttons", () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
  });

  it("shows compose form when Send Email is clicked", () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("shows success modal after sending", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Your message has been sent.")).toBeInTheDocument();
    });
  });

  it("returns to officer list after dismissing success modal", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
  });

  it("returns to officer list when Cancel is clicked", () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<OfficerContacts token="test-token" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
