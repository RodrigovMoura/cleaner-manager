import { describe, it, expect } from "vitest";
import {
  isValidTimezone,
  resolveTimezone,
  getZonedDayBounds,
  getZonedWeekBounds,
  getZonedMonthBounds,
  isTomorrowInTimezone,
  getCalendarDaysDiffInTimezone,
  formatInTimezone,
  formatTimeInTimezone,
  getGreetingInTimezone,
  DEFAULT_TIMEZONE,
} from "./timezone";

describe("timezone utilities", () => {
  it("should validate and resolve timezones correctly", () => {
    expect(isValidTimezone("Australia/Perth")).toBe(true);
    expect(isValidTimezone("Australia/Sydney")).toBe(true);
    expect(isValidTimezone("Invalid/Timezone")).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone("")).toBe(false);

    expect(resolveTimezone("Australia/Perth")).toBe("Australia/Perth");
    expect(resolveTimezone("Invalid/Zone")).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimezone(null)).toBe(DEFAULT_TIMEZONE);
  });

  it("should correctly compute day bounds for Saturday morning in Perth (Saturday 7:08 AM scenario)", () => {
    // 2026-09-11T23:08:27.590Z UTC is Saturday 2026-09-12 07:08:27 AM in Perth (UTC+8)
    const bookingMoment = new Date("2026-09-11T23:08:27.590Z");
    const bounds = getZonedDayBounds(bookingMoment, "Australia/Perth");

    expect(bounds.dateStr).toBe("2026-09-12");
    // Start of Saturday in Perth (00:00:00 AWST) in UTC is 2026-09-11T16:00:00.000Z
    expect(bounds.startOfDay.toISOString()).toBe("2026-09-11T16:00:00.000Z");
    // End of Saturday in Perth (23:59:59.999 AWST) in UTC is 2026-09-12T15:59:59.999Z
    expect(bounds.endOfDay.toISOString()).toBe("2026-09-12T15:59:59.999Z");

    // Maxine Spagnolo's appointment at 8:00 AM AWST (2026-09-12T00:00:00.000Z UTC) MUST be within today's bounds!
    const maxineDate = new Date("2026-09-12T00:00:00.000Z");
    expect(maxineDate >= bounds.startOfDay && maxineDate <= bounds.endOfDay).toBe(true);

    // Kate Dolling's Friday appointment (2026-09-11T04:30:00.000Z UTC) MUST NOT be in today's bounds!
    const kateDate = new Date("2026-09-11T04:30:00.000Z");
    expect(kateDate >= bounds.startOfDay && kateDate <= bounds.endOfDay).toBe(false);
  });

  it("should return the proper greeting based on the timezone hour", () => {
    // 2026-09-11T23:08:27.590Z is 07:08 AM in Perth -> "Good morning"
    const morningPerth = new Date("2026-09-11T23:08:27.590Z");
    expect(getGreetingInTimezone(morningPerth, "Australia/Perth")).toBe("Good morning");

    // 06:00 UTC is 14:00 (2 PM) in Perth -> "Good afternoon"
    const afternoonPerth = new Date("2026-09-12T06:00:00.000Z");
    expect(getGreetingInTimezone(afternoonPerth, "Australia/Perth")).toBe("Good afternoon");

    // 12:00 UTC is 20:00 (8 PM) in Perth -> "Good evening"
    const eveningPerth = new Date("2026-09-12T12:00:00.000Z");
    expect(getGreetingInTimezone(eveningPerth, "Australia/Perth")).toBe("Good evening");
  });

  it("should format time and date in the user's timezone", () => {
    const maxineDate = new Date("2026-09-12T00:00:00.000Z");
    const formattedTime = formatTimeInTimezone(maxineDate, "Australia/Perth");
    expect(formattedTime).toMatch(/08:00/);

    const formattedDate = formatInTimezone(maxineDate, "Australia/Perth", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    expect(formattedDate).toContain("Saturday");
    expect(formattedDate).toContain("12");
    expect(formattedDate).toContain("September");
    expect(formattedDate).toContain("2026");
  });

  it("should calculate week and month bounds accurately in Perth timezone", () => {
    // Saturday Sep 12, 2026 (booking moment: Friday 23:08 UTC)
    const bookingMoment = new Date("2026-09-11T23:08:27.590Z");
    const week = getZonedWeekBounds(bookingMoment, "Australia/Perth");

    // Monday of that week was Sep 7, 2026 00:00 AWST -> Sep 6 16:00 UTC
    expect(week.startOfWeek.toISOString()).toBe("2026-09-06T16:00:00.000Z");
    // Sunday of that week was Sep 13, 2026 23:59:59.999 AWST -> Sep 13 15:59:59.999 UTC
    expect(week.endOfWeek.toISOString()).toBe("2026-09-13T15:59:59.999Z");

    const month = getZonedMonthBounds(bookingMoment, "Australia/Perth");
    // Sep 1 00:00 AWST -> Aug 31 16:00 UTC
    expect(month.startOfMonth.toISOString()).toBe("2026-08-31T16:00:00.000Z");
    // Sep 30 23:59:59.999 AWST -> Sep 30 15:59:59.999 UTC
    expect(month.endOfMonth.toISOString()).toBe("2026-09-30T15:59:59.999Z");
  });

  it("should accurately determine if an appointment is tomorrow in timezone", () => {
    const today = new Date("2026-09-11T23:08:27.590Z"); // Saturday 7:08 AM Perth
    const sundayApt = new Date("2026-09-13T01:00:00.000Z"); // Sunday 9:00 AM Perth
    const mondayApt = new Date("2026-09-14T01:00:00.000Z"); // Monday 9:00 AM Perth
    const saturdaySameDayApt = new Date("2026-09-12T02:00:00.000Z"); // Saturday 10:00 AM Perth

    expect(isTomorrowInTimezone(today, sundayApt, "Australia/Perth")).toBe(true);
    expect(isTomorrowInTimezone(today, mondayApt, "Australia/Perth")).toBe(false);
    expect(isTomorrowInTimezone(today, saturdaySameDayApt, "Australia/Perth")).toBe(false);
  });

  it("should accurately calculate calendar days difference regardless of appointment hour", () => {
    // Cron runs at 08:00 AM AWST on Monday (2026-09-14 00:00:00 UTC)
    const cronRunMonday8AM = new Date("2026-09-14T00:00:00.000Z");

    // Tuesday appointments at different times
    const tuesdayMorningApt = new Date("2026-09-14T22:00:00.000Z"); // Tuesday 06:00 AM AWST
    const tuesdayMiddayApt = new Date("2026-09-15T04:00:00.000Z");  // Tuesday 12:00 PM AWST
    const tuesdayEveningApt = new Date("2026-09-15T10:00:00.000Z"); // Tuesday 06:00 PM AWST

    // All Tuesday appointments are exactly 1 calendar day away from Monday in Perth
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, tuesdayMorningApt, "Australia/Perth")).toBe(1);
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, tuesdayMiddayApt, "Australia/Perth")).toBe(1);
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, tuesdayEveningApt, "Australia/Perth")).toBe(1);

    // Monday same day appointment (e.g. 2:00 PM) -> 0 calendar days
    const mondayAfternoonApt = new Date("2026-09-14T06:00:00.000Z");
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, mondayAfternoonApt, "Australia/Perth")).toBe(0);

    // Wednesday appointment -> 2 calendar days
    const wednesdayApt = new Date("2026-09-16T01:00:00.000Z");
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, wednesdayApt, "Australia/Perth")).toBe(2);

    // Sunday past appointment -> -1 calendar day
    const sundayApt = new Date("2026-09-13T01:00:00.000Z");
    expect(getCalendarDaysDiffInTimezone(cronRunMonday8AM, sundayApt, "Australia/Perth")).toBe(-1);
  });
});
