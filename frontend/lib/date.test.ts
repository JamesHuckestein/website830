import { describe, expect, it } from "vitest";

import { formatDay } from "@/lib/date";

describe("formatDay", () => {
  it("formats a YYYY-MM-DD string in long en-US form", () => {
    expect(formatDay("2026-05-06")).toBe("Wednesday, May 6, 2026");
  });

  it("handles single-digit months and days", () => {
    expect(formatDay("2026-01-01")).toBe("Thursday, January 1, 2026");
  });

  it("handles leap days", () => {
    expect(formatDay("2024-02-29")).toBe("Thursday, February 29, 2024");
  });
});
