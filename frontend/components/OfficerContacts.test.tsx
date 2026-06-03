import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OfficerContacts } from "@/components/OfficerContacts";

const mockOfficers = Array.from({ length: 14 }, (_, i) => ({
  title: `Officer ${i + 1}`,
  name: `Name ${i + 1}`,
  photoUrl: `/officers/photo-${i + 1}.png`,
}));
mockOfficers[0] = { title: "Grand Knight", name: "John Akers", photoUrl: "/officers/john-h-akers.png" };

vi.mock("@/lib/api", () => ({
  emailOfficer: vi.fn().mockResolvedValue({ success: true, message: "Your message has been sent." }),
  getOfficers: vi.fn().mockResolvedValue(Array.from({ length: 14 }, (_, i) => ({
    title: i === 0 ? "Grand Knight" : `Officer ${i + 1}`,
    name: i === 0 ? "John Akers" : `Name ${i + 1}`,
    photoUrl: `/officers/photo-${i + 1}.png`,
  }))),
}));

describe("OfficerContacts", () => {
  it("renders all 14 officer Send Email buttons", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
    });
  });

  it("shows compose form when Send Email is clicked", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    await waitFor(() => screen.getAllByRole("button", { name: "Send Email" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("shows success modal after sending", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    await waitFor(() => screen.getAllByRole("button", { name: "Send Email" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Your message has been sent.")).toBeInTheDocument();
    });
  });

  it("returns to officer list after dismissing success modal", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    await waitFor(() => screen.getAllByRole("button", { name: "Send Email" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
    });
  });

  it("returns to officer list when Cancel is clicked", async () => {
    render(<OfficerContacts token="test-token" onBack={vi.fn()} />);
    await waitFor(() => screen.getAllByRole("button", { name: "Send Email" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Send Email" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Send Email" })).toHaveLength(14);
    });
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<OfficerContacts token="test-token" onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
