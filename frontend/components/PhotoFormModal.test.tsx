import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhotoFormModal } from "@/components/PhotoFormModal";

describe("PhotoFormModal", () => {
  it("renders Add headline and empty fields in add mode", () => {
    render(<PhotoFormModal mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add Photo" })).toBeInTheDocument();
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("");
  });

  it("renders Edit headline and pre-fills title in edit mode", () => {
    render(
      <PhotoFormModal
        mode="edit"
        initialTitle="Spring Dinner"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Edit Photo" })).toBeInTheDocument();
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Spring Dinner");
  });

  it("shows the supported-formats helper text", () => {
    render(<PhotoFormModal mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Supported formats: JPEG, PNG, WebP, GIF.")).toBeInTheDocument();
  });

  it("does not call onSave and shows required errors when fields are empty on Save", () => {
    const onSave = vi.fn();
    render(<PhotoFormModal mode="add" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("A photo file is required.")).toBeInTheDocument();
  });

  it("calls onSave with trimmed title and file when both fields are filled", () => {
    const onSave = vi.fn();
    render(<PhotoFormModal mode="add" onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "  Charity Drive  " } });
    const file = new File(["fake"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Upload Photo") as HTMLInputElement, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({ title: "Charity Drive", file });
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<PhotoFormModal mode="add" onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows Saving... label and disables both buttons when submitting", () => {
    render(
      <PhotoFormModal mode="add" submitting onSave={vi.fn()} onCancel={vi.fn()} />,
    );
    const save = screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
  });
});
