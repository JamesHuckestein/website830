import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MemberList } from "@/components/MemberList";

vi.mock("@/lib/api", () => ({
  getMembers: vi.fn().mockResolvedValue([
    { memberNumber: "8301001", firstName: "James", lastName: "Huckestein", email: "j@koc.org", phone: "903-555-0101", birthday: "1968-03-15", officerPosition: "Deputy Grand Knight", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
    { memberNumber: "8301002", firstName: "John", lastName: "Akers", email: "john@koc.org", phone: "903-555-0102", birthday: "1955-11-28", officerPosition: "Grand Knight", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
  ]),
  emailAllMembers: vi.fn().mockResolvedValue(undefined),
  exportMembersCSV: vi.fn().mockResolvedValue(new Blob(["csv"], { type: "text/csv" })),
}));

describe("MemberList", () => {
  it("renders member rows", async () => {
    render(<MemberList token="test-token" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("James Huckestein")).toBeInTheDocument();
      expect(screen.getByText("John Akers")).toBeInTheDocument();
    });
  });

  it("does not show officer buttons for non-officer", async () => {
    render(<MemberList token="test-token" isOfficer={false} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("James Huckestein"));
    expect(screen.queryByRole("button", { name: "Email Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download Members" })).not.toBeInTheDocument();
  });

  it("shows officer buttons for officer", async () => {
    render(<MemberList token="test-token" isOfficer={true} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Email Members" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Download Members" })).toBeInTheDocument();
    });
  });

  it("shows email compose form when Email Members is clicked", async () => {
    render(<MemberList token="test-token" isOfficer={true} onBack={vi.fn()} />);
    await waitFor(() => screen.getByRole("button", { name: "Email Members" }));
    fireEvent.click(screen.getByRole("button", { name: "Email Members" }));
    expect(screen.getByText("Message to All Members")).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<MemberList token="test-token" isOfficer={false} onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
