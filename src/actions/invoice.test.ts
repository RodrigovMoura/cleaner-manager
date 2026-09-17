import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateInvoiceNumber,
  createInvoiceForAppointment,
  updateInvoiceStatus,
  getInvoices,
} from "./invoice";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    appointment: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
  FROM_EMAIL: "test@example.com",
  REPLY_TO_EMAIL: "reply@example.com",
}));

describe("invoice actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateInvoiceNumber", () => {
    it("should generate INV-YYYY-0001 when user has no existing invoices", async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null);

      const currentYear = new Date().getFullYear();
      const num = await generateInvoiceNumber("user-1");

      expect(num).toBe(`INV-${currentYear}-0001`);
    });

    it("should correctly increment from the maximum sequence number (avoiding count collisions)", async () => {
      const currentYear = new Date().getFullYear();
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([
        { invoiceNumber: `INV-${currentYear}-0001` },
        { invoiceNumber: `INV-${currentYear}-0004` }, // e.g. 0002 and 0003 were deleted
      ] as never);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null);

      const num = await generateInvoiceNumber("user-1");

      expect(num).toBe(`INV-${currentYear}-0005`);
    });
  });

  describe("createInvoiceForAppointment", () => {
    it("should return unauthorized when session is missing", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await createInvoiceForAppointment("apt-1");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
    });

    it("should prevent duplicate invoice creation if appointment already has an invoice", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "apt-1",
        invoice: { id: "inv-1" },
        client: { userId: "user-1" },
      } as never);

      const result = await createInvoiceForAppointment("apt-1");

      expect(result.success).toBe(false);
      expect(result.message).toContain("already exists");
    });

    it("should create invoice with userId and sequential invoice number", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const currentYear = new Date().getFullYear();

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "apt-1",
        clientId: "client-1",
        date: new Date("2026-09-17T10:00:00Z"),
        price: new Prisma.Decimal(135.0),
        durationMinutes: 180,
        invoice: null,
        client: {
          id: "client-1",
          userId: "user-1",
          hourlyRate: new Prisma.Decimal(45.0),
          autoSendInvoice: false,
          email: "test@example.com",
        },
      } as never);

      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        bankAccountName: "Ana Soares",
        bankBsb: "123-456",
        bankAccountNo: "87654321",
        payId: null,
      } as never);

      vi.mocked(prisma.invoice.create).mockResolvedValueOnce({
        id: "inv-new",
        invoiceNumber: `INV-${currentYear}-0001`,
      } as never);

      const result = await createInvoiceForAppointment("apt-1");

      expect(result.success).toBe(true);
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appointmentId: "apt-1",
          clientId: "client-1",
          userId: "user-1",
          invoiceNumber: `INV-${currentYear}-0001`,
          status: "PENDING",
        }),
      });
    });
  });

  describe("updateInvoiceStatus", () => {
    it("should update status to PAID and set paidAt timestamp", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.invoice.findFirst).mockResolvedValueOnce({
        id: "inv-1",
        clientId: "client-1",
      } as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce({} as never);

      const result = await updateInvoiceStatus("inv-1", "PAID");

      expect(result.success).toBe(true);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: expect.objectContaining({
          status: "PAID",
          paidAt: expect.any(Date),
        }),
      });
    });
  });

  describe("getInvoices", () => {
    it("should return empty array if unauthorized", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);
      const res = await getInvoices();
      expect(res).toEqual([]);
    });

    it("should fetch invoices scoped to current user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([{ id: "inv-1" }] as never);

      const res = await getInvoices();

      expect(res).toHaveLength(1);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            client: {
              userId: "user-1",
            },
          },
        }),
      );
    });
  });
});
