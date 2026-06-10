import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnouncementFormModal } from "@/components/AnnouncementFormModal";

describe("AnnouncementFormModal", () => {
  it("renders Add header", () => {
    render(<AnnouncementFormModal mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add Announcement" })).toBeInTheDocument();
  });

  it("renders Edit header and prefills initial values", () => {
    render(
      <AnnouncementFormModal
        mode="edit"
        initialValues={{
          title: "Spring Charity Dinner",
          details: "Join us for the dinner.",
          deleteDate: "2026-05-31",
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Edit Announcement" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spring Charity Dinner")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Join us for the dinner.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-05-31")).toBeInTheDocument();
  });

  it("blocks save and shows errors when required fields are empty", () => {
    const onSave = vi.fn();
    render(<AnnouncementFormModal mode="add" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Date to Delete is required.")).toBeInTheDocument();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Announcement Details is required.")).toBeInTheDocument();
  });

  it("blocks save when only the date is missing", () => {
    const onSave = vi.fn();
    render(<AnnouncementFormModal mode="add" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText("Announcement Details"), { target: { value: "D" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Date to Delete is required.")).toBeInTheDocument();
  });

  it("calls onSave with trimmed values when all fields are valid", () => {
    const onSave = vi.fn();
    render(<AnnouncementFormModal mode="add" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "  Spring Charity Dinner  " } });
    fireEvent.change(screen.getByLabelText("Announcement Details"), { target: { value: "  Join us.  " } });
    fireEvent.change(screen.getByLabelText("Date to Delete"), { target: { value: "2026-05-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      title: "Spring Charity Dinner",
      details: "Join us.",
      deleteDate: "2026-05-31",
    });
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<AnnouncementFormModal mode="add" onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("disables Save and shows 'Saving...' when submitting=true", () => {
    render(
      <AnnouncementFormModal
        mode="add"
        submitting={true}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
