import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateAppointment, getAppointmentById } from "./appointment";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AppointmentStatus, Prisma } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
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
});
