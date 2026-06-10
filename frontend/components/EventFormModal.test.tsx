import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventFormModal } from "@/components/EventFormModal";

describe("EventFormModal", () => {
  it("renders Add header and formatted day", () => {
    render(<EventFormModal mode="add" day="2026-05-06" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add Event" })).toBeInTheDocument();
    expect(screen.getByText("Wednesday, May 6, 2026")).toBeInTheDocument();
  });

  it("renders Edit header and prefills initial values", () => {
    render(
      <EventFormModal
        mode="edit"
        day="2026-05-06"
        initialValues={{
          title: "Council Meeting",
          description: "Monthly meeting.",
          timeOfDay: "18:30",
          location: "Parish Hall",
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Edit Event" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Council Meeting")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Monthly meeting.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18:30")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Parish Hall")).toBeInTheDocument();
  });

  it("blocks save and shows errors when title/description are empty", () => {
    const onSave = vi.fn();
    render(<EventFormModal mode="add" day="2026-05-06" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
  });

  it("calls onSave with trimmed values and nullable optionals", () => {
    const onSave = vi.fn();
    render(<EventFormModal mode="add" day="2026-05-06" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "  Title  " } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "  Desc  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      title: "Title",
      description: "Desc",
      timeOfDay: null,
      location: null,
    });
  });

  it("calls onSave with timeOfDay and location when provided", () => {
    const onSave = vi.fn();
    render(<EventFormModal mode="add" day="2026-05-06" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Council Meeting" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Monthly meeting." } });
    fireEvent.change(screen.getByLabelText("Time (optional)"), { target: { value: "18:30" } });
    fireEvent.change(screen.getByLabelText("Location (optional)"), { target: { value: "Parish Hall" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      title: "Council Meeting",
      description: "Monthly meeting.",
      timeOfDay: "18:30",
      location: "Parish Hall",
    });
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<EventFormModal mode="add" day="2026-05-06" onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("disables Save and Cancel and shows 'Saving...' when submitting=true", () => {
    render(
      <EventFormModal
        mode="add"
        day="2026-05-06"
        submitting={true}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const save = screen.getByRole("button", { name: "Saving..." });
    expect(save).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
