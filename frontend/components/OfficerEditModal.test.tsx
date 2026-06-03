import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficerEditModal } from "@/components/OfficerEditModal";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getMembers: vi.fn(),
  updateOfficer: vi.fn(),
}));

const mockMembers: api.MemberResponse[] = [
  { memberNumber: "8301001", firstName: "James", lastName: "Huckestein", email: "j@koc.org", phone: "903-555-0101", birthday: "1968-03-15", officerPosition: "Deputy Grand Knight", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
  { memberNumber: "8301004", firstName: "Mark", lastName: "Radcliffe", email: "m@koc.org", phone: "903-555-0104", birthday: "1970-05-02", officerPosition: "Advocate", addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
  { memberNumber: "8301015", firstName: "Thomas", lastName: "Wilson", email: "t@koc.org", phone: "903-555-0115", birthday: "1990-11-03", officerPosition: null, addressStreet: "", addressCity: "", addressState: "", addressZip: "", assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
];

beforeEach(() => {
  vi.mocked(api.getMembers).mockResolvedValue(mockMembers);
  vi.mocked(api.updateOfficer).mockResolvedValue({ success: true, message: "Officer updated." });
});

describe("OfficerEditModal", () => {
  it("renders the modal with the officer title", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText("Edit Treasurer")).toBeInTheDocument();
  });

  it("shows helper text about PNG format", () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText(/Only PNG formatted photos are allowed/)).toBeInTheDocument();
  });

  it("populates member dropdown on focus", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type to search members...");
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText("Huckestein, James")).toBeInTheDocument();
    });
    expect(screen.getByText("Radcliffe, Mark")).toBeInTheDocument();
    expect(screen.getByText("Wilson, Thomas")).toBeInTheDocument();
  });

  it("filters members when typing", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type to search members...");
    fireEvent.focus(input);
    await waitFor(() => screen.getByText("Huckestein, James"));
    fireEvent.change(input, { target: { value: "wil" } });
    expect(screen.getByText("Wilson, Thomas")).toBeInTheDocument();
    expect(screen.queryByText("Huckestein, James")).toBeNull();
    expect(screen.queryByText("Radcliffe, Mark")).toBeNull();
  });

  it("Save button is disabled when no member or photo selected", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<OfficerEditModal title="Treasurer" token="t" onClose={onClose} onSaved={vi.fn()} onError={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("selects a member from the dropdown", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type to search members...");
    fireEvent.focus(input);
    await waitFor(() => screen.getByText("Wilson, Thomas"));
    fireEvent.click(screen.getByText("Wilson, Thomas"));
    expect(input).toHaveValue("Wilson, Thomas");
  });

  it("calls onSaved after successful save with member and PNG file", async () => {
    const onSaved = vi.fn();
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={onSaved} onError={vi.fn()} />);

    const input = screen.getByPlaceholderText("Type to search members...");
    fireEvent.focus(input);
    await waitFor(() => screen.getByText("Wilson, Thomas"));
    fireEvent.click(screen.getByText("Wilson, Thomas"));

    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngHeader], "test.png", { type: "image/png" });
    const fileInput = screen.getByLabelText("Upload Photo") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("Officer updated.");
    });
    expect(api.updateOfficer).toHaveBeenCalledWith("t", "Treasurer", expect.objectContaining({
      memberNumber: "8301015",
      photoFilename: "test.png",
    }));
  });

  it("calls onError when updateOfficer fails", async () => {
    vi.mocked(api.updateOfficer).mockRejectedValueOnce(new Error("Only PNG photos are allowed."));
    const onError = vi.fn();
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={onError} />);

    const input = screen.getByPlaceholderText("Type to search members...");
    fireEvent.focus(input);
    await waitFor(() => screen.getByText("Wilson, Thomas"));
    fireEvent.click(screen.getByText("Wilson, Thomas"));

    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngHeader], "test.png", { type: "image/png" });
    const fileInput = screen.getByLabelText("Upload Photo") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Only PNG photos are allowed.");
    });
  });

  it("rejects non-PNG files", async () => {
    render(<OfficerEditModal title="Treasurer" token="t" onClose={vi.fn()} onSaved={vi.fn()} onError={vi.fn()} />);

    const file = new File(["not a png"], "test.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText("Upload Photo") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.queryByText("Selected: test.jpg")).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
