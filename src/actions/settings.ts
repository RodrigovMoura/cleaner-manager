"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  sanitizeInput,
  formatBsb,
  validateBankDetails,
  BankDetailsErrors,
} from "@/lib/validation";

export type SettingsActionResult = {
  success: boolean;
  message: string;
  errors?: BankDetailsErrors;
};

export async function getUserBankDetails() {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      bankAccountName: true,
      bankBsb: true,
      bankAccountNo: true,
      payId: true,
    },
  });

  return user;
}

export async function updateBankDetails(formData: FormData): Promise<SettingsActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const rawAccountName = formData.get("bankAccountName") as string;
    const rawBsb = formData.get("bankBsb") as string;
    const rawAccountNo = formData.get("bankAccountNo") as string;
    const rawPayId = formData.get("payId") as string;

    const bankAccountName = sanitizeInput(rawAccountName);
    const bankBsb = sanitizeInput(rawBsb);
    const bankAccountNo = sanitizeInput(rawAccountNo);
    const payId = sanitizeInput(rawPayId);

    const validation = validateBankDetails({
      bankAccountName,
      bankBsb,
      bankAccountNo,
      payId,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || "Invalid bank details provided.";
      return {
        success: false,
        message: firstError,
        errors: validation.errors,
      };
    }

    const formattedBsbVal = bankBsb ? formatBsb(bankBsb) : null;
    const formattedAccountNo = bankAccountNo ? bankAccountNo.replace(/[\s-]/g, "") : null;

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        bankAccountName: bankAccountName || null,
        bankBsb: formattedBsbVal,
        bankAccountNo: formattedAccountNo,
        payId: payId || null,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/invoices");

    return {
      success: true,
      message: "Bank details saved successfully! They will now appear on all new invoices.",
    };
  } catch (error) {
    console.error("Failed to update bank details:", error);
    return {
      success: false,
      message: "An error occurred while saving bank details.",
    };
  }
}
