"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type AutomationField =
  | "enableAppointmentReminder"
  | "reminderDaysBefore"
  | "enableInvoice"
  | "autoSendInvoice"
  | "enablePaymentReminder";

export type AutomationActionResult<T = unknown> = {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
};

export async function updateClientAutomationRule(
  clientId: string,
  field: AutomationField,
  value: boolean | number
): Promise<AutomationActionResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const validFields: AutomationField[] = [
      "enableAppointmentReminder",
      "reminderDaysBefore",
      "enableInvoice",
      "autoSendInvoice",
      "enablePaymentReminder",
    ];

    if (!validFields.includes(field)) {
      return { success: false, message: "Invalid automation field specified." };
    }

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.userId,
      },
    });

    if (!client) {
      return { success: false, message: "Client not found or unauthorized." };
    }

    const updateData: Record<string, unknown> = {};

    if (field === "reminderDaysBefore") {
      const days = typeof value === "number" ? value : parseInt(String(value), 10);
      if (isNaN(days) || days < 1 || days > 7) {
        return { success: false, message: "Reminder days must be between 1 and 7." };
      }
      updateData.reminderDaysBefore = Math.floor(days);
    } else if (field === "autoSendInvoice") {
      if (typeof value !== "boolean") {
        return { success: false, message: "Invalid boolean value for autoSendInvoice." };
      }

      if (value === true) {
        if (!client.email || client.email.trim().length === 0) {
          return {
            success: false,
            message: "Client must have a valid email address to enable automatic invoice dispatch.",
          };
        }
        if (!client.enableInvoice) {
          return {
            success: false,
            message: "Cannot enable auto-send when invoice generation is disabled.",
          };
        }
      }

      updateData.autoSendInvoice = value;
    } else if (field === "enableInvoice") {
      if (typeof value !== "boolean") {
        return { success: false, message: "Invalid boolean value for enableInvoice." };
      }

      updateData.enableInvoice = value;
      // Safeguard: turning off invoice generation automatically disables auto-send
      if (value === false) {
        updateData.autoSendInvoice = false;
      }
    } else {
      if (typeof value !== "boolean") {
        return { success: false, message: `Invalid boolean value for ${field}.` };
      }
      updateData[field] = value;
    }

    await prisma.client.updateMany({
      where: {
        id: clientId,
        userId: session.userId,
      },
      data: updateData,
    });

    revalidatePath("/automations");
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      message: "Automation setting updated successfully.",
    };
  } catch (error) {
    console.error("Failed to update client automation rule:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating the automation setting.",
    };
  }
}

export async function pauseAllAutoSendInvoices(): Promise<
  AutomationActionResult<{ updatedCount: number }>
> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const result = await prisma.client.updateMany({
      where: {
        userId: session.userId,
        autoSendInvoice: true,
      },
      data: {
        autoSendInvoice: false,
      },
    });

    revalidatePath("/automations");
    revalidatePath("/clients");

    return {
      success: true,
      message: `Automatic invoice dispatch paused for ${result.count} client(s).`,
      data: { updatedCount: result.count },
    };
  } catch (error) {
    console.error("Failed to pause all auto send invoices:", error);
    return {
      success: false,
      message: "An error occurred while attempting to pause auto-send invoices.",
    };
  }
}
