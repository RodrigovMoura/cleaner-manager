import { describe, it, expect } from "vitest";
import { formatToDateTimeLocal } from "./date";

describe("formatToDateTimeLocal", () => {
  it("should return empty string for null, undefined, or empty string", () => {
    expect(formatToDateTimeLocal(null)).toBe("");
    expect(formatToDateTimeLocal(undefined)).toBe("");
    expect(formatToDateTimeLocal("")).toBe("");
  });

  it("should return empty string for invalid date", () => {
    expect(formatToDateTimeLocal("invalid-date-string")).toBe("");
  });

  it("should format valid Date object to local YYYY-MM-DDTHH:mm", () => {
    const testDate = new Date(2026, 8, 15, 14, 30); // Sep 15, 2026 14:30 in local time
    expect(formatToDateTimeLocal(testDate)).toBe("2026-09-15T14:30");
  });

  it("should correctly pad single-digit month, day, hour, and minute", () => {
    const testDate = new Date(2026, 0, 5, 8, 5); // Jan 5, 2026 08:05
    expect(formatToDateTimeLocal(testDate)).toBe("2026-01-05T08:05");
  });
});
