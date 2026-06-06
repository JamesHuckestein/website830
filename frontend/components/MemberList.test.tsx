import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MemberList } from "@/components/MemberList";

vi.mock("@/lib/api", () => ({
  getMembers: vi.fn().mockResolvedValue([
    { memberNumber: "8301001", firstName: "James", lastName: "Huckestein", email: "j@koc.org", phone: "903-555-0101", birthday: "1968-03-15", officerPosition: "Deputy Grand Knight", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
    { memberNumber: "8301002", firstName: "John", lastName: "Akers", email: "john@koc.org", phone: "903-555-0102", birthday: "1955-11-28", officerPosition: "Grand Knight", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
  ]),
  emailAllMembers: vi.fn().mockResolvedValue({ success: true, message: "Message sent to all members." }),
  exportMembersCSV: vi.fn().mockResolvedValue(new Blob(["csv"], { type: "text/csv" })),
  createMember: vi.fn().mockResolvedValue({ success: true, message: "Member added successfully." }),
  updateMemberFull: vi.fn().mockResolvedValue({ success: true, message: "Member updated successfully." }),
  deleteMember: vi.fn().mockResolvedValue({ success: true, message: "Member deleted successfully." }),
}));

describe("MemberList", () => {
  it("renders member rows", async () => {
    render(<MemberList token="test-token" isOfficer={false} officerPosition={null} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("James Huckestein")).toBeInTheDocument();
      expect(screen.getByText("John Akers")).toBeInTheDocument();
    });
  });

  it("does not show officer buttons for non-officer", async () => {
    render(<MemberList token="test-token" isOfficer={false} officerPosition={null} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("James Huckestein"));
    expect(screen.queryByRole("button", { name: "Email Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download Members" })).not.toBeInTheDocument();
  });

  it("shows officer buttons for officer", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Chancellor" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Email Members" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Download Members" })).toBeInTheDocument();
    });
  });

  it("shows email compose form when Email Members is clicked", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Chancellor" onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Email Members" }));
    fireEvent.click(screen.getByRole("button", { name: "Email Members" }));
    expect(screen.getByText("Message to All Members")).toBeInTheDocument();
  });

  it("shows success modal after sending email to all members", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Chancellor" onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Email Members" }));
    fireEvent.click(screen.getByRole("button", { name: "Email Members" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Message sent to all members.")).toBeInTheDocument();
    });
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<MemberList token="test-token" isOfficer={false} officerPosition={null} onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows Add/Edit/Delete buttons for Grand Knight", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Grand Knight" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });
  });

  it("shows Add/Edit/Delete buttons for Deputy Grand Knight", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Deputy Grand Knight" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });
  });

  it("shows Add/Edit/Delete buttons for Recorder", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Recorder" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });
  });

  it("shows Add/Edit/Delete buttons for Financial Secretary", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Financial Secretary" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });
  });

  it("does NOT show Add/Edit/Delete buttons for Chancellor", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Chancellor" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("James Huckestein"));
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("does NOT show Add/Edit/Delete buttons for regular member", async () => {
    render(<MemberList token="test-token" isOfficer={false} officerPosition={null} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("James Huckestein"));
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("filters members by search text", async () => {
    render(<MemberList token="test-token" isOfficer={false} officerPosition={null} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("James Huckestein"));
    fireEvent.change(screen.getByPlaceholderText("Search by name..."), { target: { value: "Akers" } });
    expect(screen.queryByText("James Huckestein")).not.toBeInTheDocument();
    expect(screen.getByText("John Akers")).toBeInTheDocument();
  });

  it("Edit and Delete buttons are disabled until a member is selected", async () => {
    render(<MemberList token="test-token" isOfficer={true} officerPosition="Grand Knight" onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
