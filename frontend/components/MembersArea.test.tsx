import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MembersArea } from "@/components/MembersArea";

describe("MembersArea", () => {
  it("renders all 7 sub-section links", () => {
    render(<MembersArea isOfficer={false} onSelect={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Contact Information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Birthdays" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prayer Requests" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Member List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Officers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Knight and Family of the Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Meeting Minutes" })).toBeInTheDocument();
  });

  it("calls onSelect with correct id when a link is clicked", () => {
    const onSelect = vi.fn();
    render(<MembersArea isOfficer={false} onSelect={onSelect} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Birthdays" }));
    expect(onSelect).toHaveBeenCalledWith("birthdays");
  });

  it("calls onLogout when Logout is clicked", () => {
    const onLogout = vi.fn();
    render(<MembersArea isOfficer={false} onSelect={vi.fn()} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(onLogout).toHaveBeenCalled();
  });

  it("hides the Calendar Updates link for non-officers", () => {
    render(<MembersArea isOfficer={false} onSelect={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Calendar Updates" })).toBeNull();
  });

  it("shows the Calendar Updates link for officers", () => {
    render(<MembersArea isOfficer={true} onSelect={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Calendar Updates" })).toBeInTheDocument();
  });

  it("dispatches calendarUpdates when the officer link is clicked", () => {
    const onSelect = vi.fn();
    render(<MembersArea isOfficer={true} onSelect={onSelect} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Calendar Updates" }));
    expect(onSelect).toHaveBeenCalledWith("calendarUpdates");
  });

  it("hides the Edit Announcements link for non-officers", () => {
    render(<MembersArea isOfficer={false} onSelect={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Edit Announcements" })).toBeNull();
  });

  it("shows the Edit Announcements link for officers", () => {
    render(<MembersArea isOfficer={true} onSelect={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit Announcements" })).toBeInTheDocument();
  });

  it("dispatches announcementsUpdate when the Edit Announcements link is clicked", () => {
    const onSelect = vi.fn();
    render(<MembersArea isOfficer={true} onSelect={onSelect} onLogout={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Announcements" }));
    expect(onSelect).toHaveBeenCalledWith("announcementsUpdate");
  });
});
