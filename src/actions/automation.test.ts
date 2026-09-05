import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateClientAutomationRule, pauseAllAutoSendInvoices } from "./automation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("automation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateClientAutomationRule", () => {
    it("should return unauthorized if session is missing", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const res = await updateClientAutomationRule("c1", "enableAppointmentReminder", true);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it("should return error if invalid field is specified", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });

      // @ts-expect-error testing invalid field runtime check
      const res = await updateClientAutomationRule("c1", "invalidField", true);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Invalid automation field");
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it("should return error if client is not found or belongs to another user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null);

      const res = await updateClientAutomationRule("c1", "enableAppointmentReminder", true);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Client not found");
      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: { id: "c1", userId: "u1" },
      });
    });

    it("should prevent enabling autoSendInvoice if client has no email", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        email: null,
        enableInvoice: true,
      } as never);

      const res = await updateClientAutomationRule("c1", "autoSendInvoice", true);
      expect(res.success).toBe(false);
      expect(res.message).toContain("valid email address");
      expect(prisma.client.updateMany).not.toHaveBeenCalled();
    });

    it("should prevent enabling autoSendInvoice if enableInvoice is false", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        email: "client@example.com",
        enableInvoice: false,
      } as never);

      const res = await updateClientAutomationRule("c1", "autoSendInvoice", true);
      expect(res.success).toBe(false);
      expect(res.message).toContain("invoice generation is disabled");
      expect(prisma.client.updateMany).not.toHaveBeenCalled();
    });

    it("should successfully enable autoSendInvoice when email and enableInvoice are present", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        email: "client@example.com",
        enableInvoice: true,
      } as never);
      vi.mocked(prisma.client.updateMany).mockResolvedValueOnce({ count: 1 });

      const res = await updateClientAutomationRule("c1", "autoSendInvoice", true);
      expect(res.success).toBe(true);
      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { id: "c1", userId: "u1" },
        data: { autoSendInvoice: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/automations");
      expect(revalidatePath).toHaveBeenCalledWith("/clients");
      expect(revalidatePath).toHaveBeenCalledWith("/clients/c1");
    });

    it("should automatically disable autoSendInvoice when enableInvoice is set to false", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        email: "client@example.com",
        enableInvoice: true,
        autoSendInvoice: true,
      } as never);
      vi.mocked(prisma.client.updateMany).mockResolvedValueOnce({ count: 1 });

      const res = await updateClientAutomationRule("c1", "enableInvoice", false);
      expect(res.success).toBe(true);
      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { id: "c1", userId: "u1" },
        data: { enableInvoice: false, autoSendInvoice: false },
      });
    });

    it("should validate reminderDaysBefore within 1..7", async () => {
      vi.mocked(getSession).mockResolvedValue({ userId: "u1" });
      vi.mocked(prisma.client.findFirst).mockResolvedValue({
        id: "c1",
        userId: "u1",
      } as never);

      // Out of range (0)
      const res0 = await updateClientAutomationRule("c1", "reminderDaysBefore", 0);
      expect(res0.success).toBe(false);
      expect(res0.message).toContain("between 1 and 7");

      // Out of range (8)
      const res8 = await updateClientAutomationRule("c1", "reminderDaysBefore", 8);
      expect(res8.success).toBe(false);
      expect(res8.message).toContain("between 1 and 7");

      // Valid range (3)
      vi.mocked(prisma.client.updateMany).mockResolvedValueOnce({ count: 1 });
      const resValid = await updateClientAutomationRule("c1", "reminderDaysBefore", 3);
      expect(resValid.success).toBe(true);
      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { id: "c1", userId: "u1" },
        data: { reminderDaysBefore: 3 },
      });
    });
  });

  describe("pauseAllAutoSendInvoices", () => {
    it("should return unauthorized if session is missing", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const res = await pauseAllAutoSendInvoices();
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
      expect(prisma.client.updateMany).not.toHaveBeenCalled();
    });

    it("should disable autoSendInvoice for all user clients", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.client.updateMany).mockResolvedValueOnce({ count: 5 });

      const res = await pauseAllAutoSendInvoices();
      expect(res.success).toBe(true);
      expect(res.data?.updatedCount).toBe(5);
      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", autoSendInvoice: true },
        data: { autoSendInvoice: false },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/automations");
      expect(revalidatePath).toHaveBeenCalledWith("/clients");
    });
  });
});
