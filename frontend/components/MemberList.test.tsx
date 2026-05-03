import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MemberList } from "@/components/MemberList";

describe("MemberList", () => {
  it("renders member rows", () => {
    render(<MemberList isOfficer={false} onBack={vi.fn()} />);
    expect(screen.getByText("James Huckestein")).toBeInTheDocument();
    expect(screen.getByText("John Akers")).toBeInTheDocument();
  });

  it("does not show officer buttons for non-officer", () => {
    render(<MemberList isOfficer={false} onBack={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Email Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download Members" })).not.toBeInTheDocument();
  });

  it("shows officer buttons for officer", () => {
    render(<MemberList isOfficer={true} onBack={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Email Members" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Members" })).toBeInTheDocument();
  });

  it("shows email compose form when Email Members is clicked", () => {
    render(<MemberList isOfficer={true} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Email Members" }));
    expect(screen.getByText("Message to All Members")).toBeInTheDocument();
  });

  it("calls onBack when back link is clicked", () => {
    const onBack = vi.fn();
    render(<MemberList isOfficer={false} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
