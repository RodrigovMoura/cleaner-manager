import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateAppointment, getAppointmentById, createAppointment, updateAppointmentStatus } from "./appointment";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, Prisma } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    appointment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

vi.mock("./invoice", () => ({
  sendInvoiceEmail: vi.fn(),
}));

describe("appointment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAppointmentById", () => {
    it("should return null if user is not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await getAppointmentById("apt-123");
      expect(result).toBeNull();
      expect(prisma.appointment.findFirst).not.toHaveBeenCalled();
    });

    it("should query appointment scoped by user id", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const mockAppointment = {
        id: "apt-123",
        clientId: "client-1",
        date: new Date("2026-10-10T10:00:00Z"),
        price: new Prisma.Decimal(120),
        status: AppointmentStatus.SCHEDULED,
        reminderSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: { id: "client-1", name: "Alice", userId: "user-1" },
        invoice: null,
      };

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(mockAppointment as never);

      const result = await getAppointmentById("apt-123");
      expect(result).toEqual(mockAppointment);
      expect(prisma.appointment.findFirst).toHaveBeenCalledWith({
        where: {
          id: "apt-123",
          client: { userId: "user-1" },
        },
        include: {
          client: true,
          invoice: true,
        },
      });
    });
  });

  describe("updateAppointment", () => {
    it("should reject update if user is not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append("date", "2026-10-10T10:00:00Z");

      const result = await updateAppointment("apt-123", formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("should reject update if appointmentId is missing", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });

      const formData = new FormData();
      formData.append("date", "2026-10-10T10:00:00Z");

      const result = await updateAppointment("", formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Appointment ID is required");
    });

    it("should reject update if date is missing or invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });

      const formData = new FormData();
      formData.append("date", "not-a-date");

      const result = await updateAppointment("apt-123", formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid date or time");
    });

    it("should reject update if appointment is not found or belongs to another user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append("date", "2026-10-10T10:00:00Z");

      const result = await updateAppointment("apt-not-owned", formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Appointment not found or unauthorized");
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("should reject if rescheduled date is in the past for a scheduled appointment", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const originalDate = new Date("2026-10-10T10:00:00Z");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "apt-123",
        clientId: "client-1",
        date: originalDate,
        price: new Prisma.Decimal(120),
        status: AppointmentStatus.SCHEDULED,
        reminderSentAt: null,
        client: { userId: "user-1" },
        invoice: null,
      } as never);

      const formData = new FormData();
      formData.append("date", pastDate.toISOString());

      const result = await updateAppointment("apt-123", formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("past");
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("should successfully update date, time, and price, resetting reminderSentAt", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const originalDate = new Date("2026-10-10T10:00:00Z");
      const newDate = new Date("2026-10-15T14:30:00Z");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "apt-123",
        clientId: "client-1",
        date: originalDate,
        price: new Prisma.Decimal(120),
        status: AppointmentStatus.SCHEDULED,
        reminderSentAt: new Date("2026-10-09T10:00:00Z"),
        client: { userId: "user-1" },
        invoice: null,
      } as never);

      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({
        id: "apt-123",
      } as never);

      const formData = new FormData();
      formData.append("date", newDate.toISOString());
      formData.append("price", "150.50");

      const result = await updateAppointment("apt-123", formData);

      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-123" },
        data: {
          date: newDate,
          price: new Prisma.Decimal(150.5),
          reminderSentAt: null, // Reset because date changed
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/schedule");
      expect(revalidatePath).toHaveBeenCalledWith("/clients/client-1");
    });

    it("should update pending invoice when appointment date and price change", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const originalDate = new Date("2026-10-10T10:00:00Z");
      const newDate = new Date("2026-10-20T10:00:00Z");

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({
        id: "apt-123",
        clientId: "client-1",
        date: originalDate,
        price: new Prisma.Decimal(100),
        status: AppointmentStatus.SCHEDULED,
        reminderSentAt: null,
        client: { userId: "user-1" },
        invoice: {
          id: "inv-999",
          status: "PENDING",
          amount: new Prisma.Decimal(100),
        },
      } as never);

      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({ id: "apt-123" } as never);
      vi.mocked(prisma.invoice.update).mockResolvedValueOnce({ id: "inv-999" } as never);

      const formData = new FormData();
      formData.append("date", newDate.toISOString());
      formData.append("price", "130.00");

      const result = await updateAppointment("apt-123", formData);

      expect(result.success).toBe(true);

      const expectedDueDate = new Date(newDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 7);

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: "inv-999" },
        data: {
          dueDate: expectedDueDate,
          amount: new Prisma.Decimal(130),
        },
      });
    });
  });

  describe("createAppointment", () => {
    it("should reject if user is not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", "2026-10-10T10:00:00Z");
      formData.append("price", "120.00");

      const result = await createAppointment(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
      expect(prisma.appointment.createMany).not.toHaveBeenCalled();
    });

    it("should reject if required fields are missing", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });

      const formData = new FormData();
      formData.append("clientId", "");
      formData.append("date", "2026-10-10T10:00:00Z");
      formData.append("price", "120.00");

      const result = await createAppointment(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Client, Date, and Price are required.");
    });

    it("should reject if date is in the past", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });

      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", "2020-01-01T10:00:00Z");
      formData.append("price", "120.00");

      const result = await createAppointment(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Appointment date cannot be in the past.");
    });

    it("should reject if client does not exist or does not belong to user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null);

      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const formData = new FormData();
      formData.append("clientId", "client-other");
      formData.append("date", futureDate);
      formData.append("price", "120.00");

      const result = await createAppointment(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Client not found or unauthorized.");
      expect(prisma.appointment.createMany).not.toHaveBeenCalled();
    });

    it("should create a single appointment for one-time recurrence", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: "client-1", userId: "user-1" } as never);
      vi.mocked(prisma.appointment.createMany).mockResolvedValueOnce({ count: 1 } as never);

      const futureDate = new Date("2026-11-10T10:00:00.000Z");
      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", futureDate.toISOString());
      formData.append("price", "120.00");
      formData.append("recurrence", "none");

      const result = await createAppointment(formData);
      expect(result.success).toBe(true);
      expect(prisma.appointment.createMany).toHaveBeenCalledWith({
        data: [
          {
            clientId: "client-1",
            date: futureDate,
            price: 120,
            durationMinutes: 144,
            status: AppointmentStatus.SCHEDULED,
          },
        ],
      });
      expect(revalidatePath).toHaveBeenCalledWith("/schedule");
      expect(revalidatePath).toHaveBeenCalledWith("/clients/client-1");
      expect(revalidatePath).toHaveBeenCalledWith("/calendar");
    });

    it("should create appointments weekly (7 days apart)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: "client-1", userId: "user-1" } as never);
      vi.mocked(prisma.appointment.createMany).mockResolvedValueOnce({ count: 4 } as never);

      const baseDate = new Date("2026-11-01T10:00:00.000Z");
      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", baseDate.toISOString());
      formData.append("price", "150.00");
      formData.append("recurrence", "weekly");
      formData.append("occurrences", "4");

      const result = await createAppointment(formData);
      expect(result.success).toBe(true);
      expect(result.message).toContain("4 weekly appointments");

      expect(prisma.appointment.createMany).toHaveBeenCalledWith({
        data: [
          { clientId: "client-1", date: new Date("2026-11-01T10:00:00.000Z"), price: 150, durationMinutes: 180, status: AppointmentStatus.SCHEDULED },
          { clientId: "client-1", date: new Date("2026-11-08T10:00:00.000Z"), price: 150, durationMinutes: 180, status: AppointmentStatus.SCHEDULED },
          { clientId: "client-1", date: new Date("2026-11-15T10:00:00.000Z"), price: 150, durationMinutes: 180, status: AppointmentStatus.SCHEDULED },
          { clientId: "client-1", date: new Date("2026-11-22T10:00:00.000Z"), price: 150, durationMinutes: 180, status: AppointmentStatus.SCHEDULED },
        ],
      });
    });

    it("should create appointments monthly (preserves day and time, handles months)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: "client-1", userId: "user-1" } as never);
      vi.mocked(prisma.appointment.createMany).mockResolvedValueOnce({ count: 3 } as never);

      const baseDate = new Date(2026, 9, 15, 10, 0); // Oct 15, 2026 10:00
      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", baseDate.toISOString());
      formData.append("price", "200.00");
      formData.append("recurrence", "monthly");
      formData.append("occurrences", "3");

      const result = await createAppointment(formData);
      expect(result.success).toBe(true);
      expect(result.message).toContain("3 monthly appointments");

      const firstCall = vi.mocked(prisma.appointment.createMany).mock.calls[0];
      const calls = (firstCall?.[0]?.data ?? []) as Prisma.AppointmentCreateManyInput[];
      expect(calls).toHaveLength(3);
      expect(new Date(calls[0].date).getMonth()).toBe(9); // October
      expect(new Date(calls[0].date).getDate()).toBe(15);
      expect(new Date(calls[1].date).getMonth()).toBe(10); // November
      expect(new Date(calls[1].date).getDate()).toBe(15);
      expect(new Date(calls[2].date).getMonth()).toBe(11); // December
      expect(new Date(calls[2].date).getDate()).toBe(15);
    });

    it("should create appointments bi-weekly (14 days apart)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({ id: "client-1", userId: "user-1" } as never);
      vi.mocked(prisma.appointment.createMany).mockResolvedValueOnce({ count: 3 } as never);

      const baseDate = new Date("2026-11-01T10:00:00.000Z");
      const formData = new FormData();
      formData.append("clientId", "client-1");
      formData.append("date", baseDate.toISOString());
      formData.append("price", "120.00");
      formData.append("recurrence", "biweekly");
      formData.append("occurrences", "3");

      const result = await createAppointment(formData);
      expect(result.success).toBe(true);
      expect(result.message).toContain("3 bi-weekly appointments");

      expect(prisma.appointment.createMany).toHaveBeenCalledWith({
        data: [
          { clientId: "client-1", date: new Date("2026-11-01T10:00:00.000Z"), price: 120, durationMinutes: 144, status: AppointmentStatus.SCHEDULED },
          { clientId: "client-1", date: new Date("2026-11-15T10:00:00.000Z"), price: 120, durationMinutes: 144, status: AppointmentStatus.SCHEDULED },
          { clientId: "client-1", date: new Date("2026-11-29T10:00:00.000Z"), price: 120, durationMinutes: 144, status: AppointmentStatus.SCHEDULED },
        ],
      });
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should complete appointment with CASH payment without generating invoice", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const mockAppointment = {
        id: "apt-1",
        clientId: "client-1",
        date: new Date("2026-11-01T10:00:00Z"),
        price: new Prisma.Decimal(150),
        durationMinutes: 180,
        status: AppointmentStatus.SCHEDULED,
        paymentMethod: null,
        client: {
          id: "client-1",
          userId: "user-1",
          enableInvoice: true,
          preferredPaymentMethod: "CASH",
        },
        invoice: null,
      };

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(mockAppointment as never);
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({} as never);

      const result = await updateAppointmentStatus("apt-1", "COMPLETED", "CASH");

      expect(result.success).toBe(true);
      expect(result.message).toContain("paid in cash");
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-1" },
        data: {
          status: "COMPLETED",
          paymentMethod: "CASH",
          price: mockAppointment.price,
          durationMinutes: 180,
        },
      });
      // Crucial: NO invoice generated for cash
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it("should complete appointment with actual price and duration variance", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const mockAppointment = {
        id: "apt-variance",
        clientId: "client-v",
        date: new Date("2026-11-01T10:00:00Z"),
        price: new Prisma.Decimal(200),
        durationMinutes: 240,
        status: AppointmentStatus.SCHEDULED,
        paymentMethod: null,
        client: {
          id: "client-v",
          userId: "user-1",
          hourlyRate: new Prisma.Decimal(50),
          enableInvoice: true,
          preferredPaymentMethod: "CASH",
        },
        invoice: null,
      };

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(mockAppointment as never);
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({} as never);

      // Worked 3h 45m (225m) @ $50/hr = $187.50
      const result = await updateAppointmentStatus("apt-variance", "COMPLETED", "CASH", 187.5, 225);

      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-variance" },
        data: {
          status: "COMPLETED",
          paymentMethod: "CASH",
          price: new Prisma.Decimal(187.5),
          durationMinutes: 225,
        },
      });
    });

    it("should complete appointment with BANK_TRANSFER and generate invoice if enabled", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const mockAppointment = {
        id: "apt-2",
        clientId: "client-2",
        date: new Date("2026-11-01T10:00:00Z"),
        price: new Prisma.Decimal(180),
        durationMinutes: 216,
        status: AppointmentStatus.SCHEDULED,
        paymentMethod: null,
        client: {
          id: "client-2",
          userId: "user-1",
          hourlyRate: new Prisma.Decimal(50),
          enableInvoice: true,
          autoSendInvoice: false,
          preferredPaymentMethod: "BANK_TRANSFER",
        },
        invoice: null,
      };

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(mockAppointment as never);
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({} as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(5);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        bankAccountName: "Clean Pro",
        bankBsb: "062-000",
        bankAccountNo: "12345678",
        payId: null,
      } as never);
      vi.mocked(prisma.invoice.create).mockResolvedValueOnce({ id: "inv-new-1" } as never);

      const result = await updateAppointmentStatus("apt-2", "COMPLETED", "BANK_TRANSFER", 187.5, 225);

      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-2" },
        data: {
          status: "COMPLETED",
          paymentMethod: "BANK_TRANSFER",
          price: new Prisma.Decimal(187.5),
          durationMinutes: 225,
        },
      });
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appointmentId: "apt-2",
            clientId: "client-2",
            invoiceNumber: "INV-2026-0006",
            amount: new Prisma.Decimal(187.5),
            durationMinutes: 225,
            hourlyRate: mockAppointment.client.hourlyRate,
            status: "PENDING",
          }),
        }),
      );
    });

    it("should reset paymentMethod to null when reopening to SCHEDULED", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-1" });
      const mockAppointment = {
        id: "apt-3",
        clientId: "client-3",
        date: new Date("2026-11-01T10:00:00Z"),
        price: new Prisma.Decimal(120),
        status: AppointmentStatus.COMPLETED,
        paymentMethod: "CASH",
        client: { id: "client-3", userId: "user-1" },
        invoice: null,
      };

      vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(mockAppointment as never);
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({} as never);

      const result = await updateAppointmentStatus("apt-3", "SCHEDULED");

      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: "apt-3" },
        data: {
          status: "SCHEDULED",
          paymentMethod: null,
        },
      });
    });
  });
});

