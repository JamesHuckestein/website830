import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficersUpdate } from "@/components/OfficersUpdate";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getOfficers: vi.fn(),
  getMembers: vi.fn().mockResolvedValue([]),
  updateOfficer: vi.fn(),
}));

const mockOfficers: api.OfficerResponse[] = [
  { title: "Grand Knight", name: "John Akers", photoUrl: "/officers/john-h-akers.png" },
  { title: "Deputy Grand Knight", name: "James Huckestein", photoUrl: "/officers/james-h.png" },
  { title: "Treasurer", name: "John Manning", photoUrl: "/officers/Manning.png" },
];

beforeEach(() => {
  vi.mocked(api.getOfficers).mockResolvedValue(mockOfficers);
});

describe("OfficersUpdate", () => {
  it("shows loading state initially", () => {
    vi.mocked(api.getOfficers).mockReturnValue(new Promise(() => {}));
    render(<OfficersUpdate token="test-token" onBack={vi.fn()} />);
    expect(screen.getByText("Loading officers...")).toBeInTheDocument();
  });

  it("renders officer cards after fetch", async () => {
    render(<OfficersUpdate token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Grand Knight")).toBeInTheDocument();
    });
    expect(screen.getByText("John Akers")).toBeInTheDocument();
    expect(screen.getByText("Treasurer")).toBeInTheDocument();
  });

  it("renders an Edit button for each officer card", async () => {
    render(<OfficersUpdate token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Grand Knight")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    expect(editButtons).toHaveLength(3);
  });

  it("opens the edit modal when Edit is clicked", async () => {
    render(<OfficersUpdate token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Grand Knight")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Edit Grand Knight")).toBeInTheDocument();
    });
  });

  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    render(<OfficersUpdate token="test-token" onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText("Grand Knight")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("renders the heading", async () => {
    render(<OfficersUpdate token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Update Officers" })).toBeInTheDocument();
    });
  });
});
