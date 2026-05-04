import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BirthdayList } from "@/components/BirthdayList";

vi.mock("@/lib/api", () => ({
  getBirthdays: vi.fn().mockResolvedValue([
    { memberNumber: "8301001", firstName: "James", lastName: "Huckestein", birthday: "1968-05-10", phone: "903-555-0101", email: "j@koc.org", addressStreet: "", addressCity: "", addressState: "", addressZip: "", officerPosition: null, assemblyNumber: null, firstDegreeDate: null, secondDegreeDate: null, thirdDegreeDate: null, fourthDegreeDate: null },
  ]),
}));

describe("BirthdayList", () => {
  it("renders the heading", async () => {
    render(<BirthdayList token="test-token" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Upcoming Birthdays" })).toBeInTheDocument();
    });
  });

  it("calls onBack when back link is clicked", async () => {
    const onBack = vi.fn();
    render(<BirthdayList token="test-token" onBack={onBack} />);
    await waitFor(() => screen.getByRole("button", { name: "Back to Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
