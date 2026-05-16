import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactInfoForm } from "@/components/ContactInfoForm";

vi.mock("@/lib/api", () => ({
  getMember: vi.fn().mockResolvedValue({
    memberNumber: "8301001",
    firstName: "James",
    lastName: "Huckestein",
    addressStreet: "123 Oak St",
    addressCity: "Denison",
    addressState: "TX",
    addressZip: "75020",
    phone: "903-555-0101",
    email: "james.huckestein@koc830.org",
    birthday: "1968-03-15",
    officerPosition: "Deputy Grand Knight",
    assemblyNumber: "1234",
    firstDegreeDate: null,
    secondDegreeDate: null,
    thirdDegreeDate: null,
    fourthDegreeDate: null,
  }),
  updateMember: vi.fn().mockResolvedValue({ success: true, message: "Contact information updated." }),
}));

describe("ContactInfoForm", () => {
  it("pre-fills fields from the API member data", async () => {
    render(<ContactInfoForm token="test-token" memberNumber="8301001" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("123 Oak St")).toBeInTheDocument();
      expect(screen.getByDisplayValue("903-555-0101")).toBeInTheDocument();
    });
  });

  it("shows success modal after saving", async () => {
    render(<ContactInfoForm token="test-token" memberNumber="8301001" onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Contact information updated.")).toBeInTheDocument();
    });
  });

  it("dismisses the modal when Dismiss is clicked", async () => {
    render(<ContactInfoForm token="test-token" memberNumber="8301001" onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("heading", { name: "Success" })).not.toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<ContactInfoForm token="test-token" memberNumber="8301001" onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
