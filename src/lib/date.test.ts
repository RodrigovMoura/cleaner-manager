import { describe, it, expect } from "vitest";
import { formatToDateTimeLocal, startOfWeek, addDays, isSameDay, getMonthGrid } from "./date";

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

describe("calendar date helpers", () => {
  it("startOfWeek should find Monday correctly", () => {
    // Wednesday, Sep 9, 2026
    const wed = new Date(2026, 8, 9);
    const mon = startOfWeek(wed, 1);
    expect(mon.getDay()).toBe(1); // Monday
    expect(mon.getDate()).toBe(7); // Sep 7, 2026
  });

  it("addDays should correctly shift dates across month boundaries", () => {
    const d = new Date(2026, 8, 30); // Sep 30, 2026
    const next = addDays(d, 2);
    expect(next.getMonth()).toBe(9); // October
    expect(next.getDate()).toBe(2);
  });

  it("isSameDay should accurately identify identical days", () => {
    const d1 = new Date(2026, 8, 10, 9, 0);
    const d2 = new Date(2026, 8, 10, 15, 30);
    const d3 = new Date(2026, 8, 11, 9, 0);
    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });

  it("getMonthGrid should return a multiple of 7 days covering the month", () => {
    const grid = getMonthGrid(2026, 8, 1); // September 2026
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);
    // First day should be a Monday
    expect(grid[0].getDay()).toBe(1);
  });
});

