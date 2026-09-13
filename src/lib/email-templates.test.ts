import { describe, it, expect } from "vitest";
import { getAppointmentReminderEmailHtml, getInvoiceEmailHtml } from "./email-templates";

describe("email-templates", () => {
  describe("getAppointmentReminderEmailHtml", () => {
    it("should include cash payment reminder and estimated hours when paymentMethod is CASH", () => {
      const html = getAppointmentReminderEmailHtml({
        clientName: "John Doe",
        formattedDate: "Monday 14 September 2026",
        formattedTime: "08:00 AM",
        address: "42 Wallaby Way, Sydney",
        price: 150,
        paymentMethod: "CASH",
        hourlyRate: 50,
      });

      expect(html).toContain("John Doe");
      expect(html).toContain("Monday 14 September 2026 at 08:00 AM");
      expect(html).toContain("42 Wallaby Way, Sydney");
      expect(html).toContain("Cash Payment Reminder");
      expect(html).toContain("$150.00 AUD");
      expect(html).toContain("3 hours");
      expect(html).toContain("$50.00/hr");
      expect(html).toContain("may vary slightly up or down depending on the actual time spent on site");
    });

    it("should handle custom hourly rate and fractional hours (e.g. 2.5 hours)", () => {
      const html = getAppointmentReminderEmailHtml({
        clientName: "Jane Smith",
        formattedDate: "Tuesday 15 September 2026",
        formattedTime: "09:30 AM",
        address: "100 Queen St, Brisbane",
        price: 150,
        paymentMethod: "CASH",
        hourlyRate: 60,
      });

      expect(html).toContain("Cash Payment Reminder");
      expect(html).toContain("2.5 hours");
      expect(html).toContain("$60.00/hr");
    });

    it("should NOT include cash payment reminder when paymentMethod is BANK_TRANSFER", () => {
      const html = getAppointmentReminderEmailHtml({
        clientName: "Bob Dylan",
        formattedDate: "Wednesday 16 September 2026",
        formattedTime: "11:00 AM",
        address: "77 Sunset Strip",
        price: 120,
        paymentMethod: "BANK_TRANSFER",
        hourlyRate: 50,
      });

      expect(html).toContain("Bob Dylan");
      expect(html).not.toContain("Cash Payment Reminder");
      expect(html).not.toContain("Please remember to leave cash payment");
    });
  });

  describe("getInvoiceEmailHtml", () => {
    it("should include invoice details and service breakdown when duration and rate are provided", () => {
      const html = getInvoiceEmailHtml({
        clientName: "Alice Cooper",
        invoiceNumber: "INV-2026-0010",
        amount: 187.5,
        dueDateStr: "20 Sep 2026",
        durationMinutes: 225,
        hourlyRate: 50,
      });

      expect(html).toContain("Alice Cooper");
      expect(html).toContain("INV-2026-0010");
      expect(html).toContain("$187.50 AUD");
      expect(html).toContain("20 Sep 2026");
      expect(html).toContain("Service Time:");
      expect(html).toContain("3 hrs 45 mins @ $50.00/hr");
    });

    it("should render clean invoice without breakdown when duration is omitted", () => {
      const html = getInvoiceEmailHtml({
        clientName: "Alice Cooper",
        invoiceNumber: "INV-2026-0011",
        amount: 200,
        dueDateStr: "20 Sep 2026",
      });

      expect(html).toContain("Alice Cooper");
      expect(html).toContain("INV-2026-0011");
      expect(html).toContain("$200.00 AUD");
      expect(html).not.toContain("Service Time:");
    });
  });
});
