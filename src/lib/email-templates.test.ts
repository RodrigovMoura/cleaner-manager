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
    it("should include company name at the top, invoice details and only the final amount", () => {
      const html = getInvoiceEmailHtml({
        clientName: "Alice Cooper",
        invoiceNumber: "INV-2026-0010",
        amount: 187.5,
        dueDateStr: "20 Sep 2026",
        durationMinutes: 225,
        hourlyRate: 50,
      });

      expect(html).toContain("Ana's Cleaning Touch");
      expect(html).toContain("Alice Cooper");
      expect(html).toContain("INV-2026-0010");
      expect(html).toContain("$187.50 AUD");
      expect(html).toContain("20 Sep 2026");
      // Hours worked and hourly rate should not appear
      expect(html).not.toContain("Service Time:");
      expect(html).not.toContain("@ $50.00/hr");
    });

    it("should render clean invoice with bank details when provided", () => {
      const html = getInvoiceEmailHtml({
        clientName: "Alice Cooper",
        invoiceNumber: "INV-2026-0011",
        amount: 200,
        dueDateStr: "20 Sep 2026",
        bankDetails: {
          accountName: "Ana Silva",
          bsb: "123-456",
          accountNumber: "98765432",
        },
      });

      expect(html).toContain("Alice Cooper");
      expect(html).toContain("INV-2026-0011");
      expect(html).toContain("$200.00 AUD");
      expect(html).toContain("123-456");
      expect(html).toContain("98765432");
      expect(html).not.toContain("Service Time:");
    });
  });
});
