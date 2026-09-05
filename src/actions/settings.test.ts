import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserBankDetails, updateBankDetails } from "./settings";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserBankDetails", () => {
    it("should return null if not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const res = await getUserBankDetails();
      expect(res).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return user bank details for authenticated user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      const mockUser = {
        name: "Rodrigo Moura",
        email: "rodrigo@example.com",
        bankAccountName: "Rodrigo Cleaning",
        bankBsb: "062-000",
        bankAccountNo: "12345678",
        payId: "rodrigo@example.com",
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);

      const res = await getUserBankDetails();
      expect(res).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: {
          name: true,
          email: true,
          bankAccountName: true,
          bankBsb: true,
          bankAccountNo: true,
          payId: true,
        },
      });
    });
  });

  describe("updateBankDetails", () => {
    it("should reject update if not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append("bankAccountName", "Rodrigo");

      const res = await updateBankDetails(formData);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject invalid BSB", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });

      const formData = new FormData();
      formData.append("bankBsb", "123"); // only 3 digits

      const res = await updateBankDetails(formData);
      expect(res.success).toBe(false);
      expect(res.errors?.bankBsb).toContain("6 digits");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject invalid account number", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });

      const formData = new FormData();
      formData.append("bankBsb", "062-000");
      formData.append("bankAccountNo", "12"); // only 2 digits

      const res = await updateBankDetails(formData);
      expect(res.success).toBe(false);
      expect(res.errors?.bankAccountNo).toContain("between 5 and 10 digits");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should successfully update and format bank details", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ userId: "u1" });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

      const formData = new FormData();
      formData.append("bankAccountName", "Rodrigo Cleaning Services");
      formData.append("bankBsb", "062000"); // will be formatted to 062-000
      formData.append("bankAccountNo", "1234 5678"); // spaces will be stripped
      formData.append("payId", "rodrigo@clean.com");

      const res = await updateBankDetails(formData);
      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: {
          bankAccountName: "Rodrigo Cleaning Services",
          bankBsb: "062-000",
          bankAccountNo: "12345678",
          payId: "rodrigo@clean.com",
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
      expect(revalidatePath).toHaveBeenCalledWith("/invoices");
    });
  });
});
