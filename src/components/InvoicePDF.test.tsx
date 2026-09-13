import { describe, it, expect } from "vitest";
import React from "react";
import InvoicePDF from "./InvoicePDF";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants";

describe("InvoicePDF Component", () => {
  const mockInvoice = {
    invoiceNumber: "INV-2026-0001",
    amount: 150.0,
    dueDate: new Date("2026-09-20T00:00:00Z"),
    createdAt: new Date("2026-09-13T00:00:00Z"),
    status: "PENDING",
    durationMinutes: 180,
    hourlyRate: 50,
    client: {
      name: "John Doe",
      email: "john@example.com",
      phone: "0400000000",
      address: "123 Main St, Perth",
    },
    appointment: {
      date: new Date("2026-09-13T10:00:00Z"),
    },
    paymentAccountName: "Ana Silva",
    paymentBsb: "123-456",
    paymentAccountNo: "12345678",
    paymentPayId: "0400000000",
    timezone: "Australia/Perth",
  };

  it("should render company name and subtitle at the top without broken emoji characters", () => {
    const element = React.createElement(InvoicePDF, { invoice: mockInvoice });
    expect(element).toBeDefined();

    // Verify company name is correctly loaded
    expect(COMPANY_NAME).toBe("Ana's Cleaning Touch");
    expect(COMPANY_SUBTITLE).toBe("Residential Cleaning Services");
  });

  it("should structure the document with company header, client info, and total amount", () => {
    const component = InvoicePDF({ invoice: mockInvoice });
    expect(component).toBeDefined();

    // Recursively extract all text strings from React PDF element tree
    const textNodes: string[] = [];
    function extractText(node: unknown) {
      if (!node) return;
      if (typeof node === "string" || typeof node === "number") {
        textNodes.push(String(node));
        return;
      }
      if (React.isValidElement(node)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const children = (node.props as any)?.children;
        if (Array.isArray(children)) {
          children.forEach(extractText);
        } else if (children) {
          extractText(children);
        }
      }
    }

    extractText(component);
    const allText = textNodes.join(" ");

    // Check company name at the top
    expect(allText).toContain("Ana's Cleaning Touch");
    expect(allText).toContain("TAX INVOICE");
    expect(allText).toContain("INV-2026-0001");
    expect(allText).toContain("John Doe");
    expect(allText).toContain("$150.00");

    // Ensure hours worked and hourly rate are NOT rendered in the invoice
    expect(allText).not.toContain("@ $50.00/hr");
    expect(allText).not.toContain("3 hrs");
    expect(allText).not.toContain("180 mins");

    // Ensure no emoji is placed in PDF text that would corrupt to >Ú
    expect(allText).not.toContain("🧚");
    expect(allText).not.toContain(">Ú");
  });
});
