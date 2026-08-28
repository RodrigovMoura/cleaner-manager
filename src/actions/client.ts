"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import { sanitizeInput, validateClientData, ClientErrors } from "@/lib/validation";

export type ClientActionResult = {
  success: boolean;
  message: string;
  errors?: ClientErrors;
};

export async function getClients() {
  const currSession = await getSession();
  if (!currSession?.userId) {
    return [];
  }

  return await prisma.client.findMany({
    where: { userId: currSession.userId },
    orderBy: { name: "asc" },
  });
}

export async function getClientById(id: string) {
  const session = await getSession();

  if (!session?.userId) {
    return null;
  }

  return await prisma.client.findFirst({
    where: {
      id,
      userId: session.userId,
    },
    include: {
      appointments: {
        orderBy: {
          date: "desc",
        },
      },
      invoices: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function updateClient(id: string, formData: FormData): Promise<ClientActionResult> {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const rawName = formData.get("name") as string;
    const rawEmail = formData.get("email") as string;
    const rawPhone = formData.get("phone") as string;
    const rawAddress = formData.get("address") as string;

    const enableAppointmentReminder = formData.get("enableAppointmentReminder") === "on";
    const reminderDaysBefore = parseInt((formData.get("reminderDaysBefore") as string) || "1", 10);
    const enableInvoice = formData.get("enableInvoice") === "on";
    const autoSendInvoice = formData.get("autoSendInvoice") === "on";
    const enablePaymentReminder = formData.get("enablePaymentReminder") === "on";

    const name = sanitizeInput(rawName);
    const email = rawEmail ? sanitizeInput(rawEmail).toLowerCase() : "";
    const phone = sanitizeInput(rawPhone);
    const address = sanitizeInput(rawAddress);

    // Validação profunda dos dados
    const validation = validateClientData({
      name,
      phone,
      email,
      address,
      reminderDaysBefore,
      enableInvoice,
      autoSendInvoice,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || "Invalid client data provided.";
      return {
        success: false,
        message: firstError,
        errors: validation.errors,
      };
    }

    await prisma.client.updateMany({
      where: {
        id,
        userId: session.userId,
      },
      data: {
        name,
        email: email || null,
        phone,
        address,
        defaultPrice: 0,
        enableAppointmentReminder,
        reminderDaysBefore,
        enableInvoice,
        autoSendInvoice,
        enablePaymentReminder,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath(`/clients/${id}/edit`);

    return { success: true, message: "Client updated successfully!" };
  } catch (error) {
    console.error("Failed to update client:", error);
    return { success: false, message: "An error occurred while updating the client. Please try again." };
  }
}

export async function createClient(formData: FormData): Promise<ClientActionResult> {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const rawName = formData.get("name") as string;
    const rawEmail = formData.get("email") as string;
    const rawPhone = formData.get("phone") as string;
    const rawAddress = formData.get("address") as string;

    // Toggle values from checkboxes
    const enableAppointmentReminder = formData.get("enableAppointmentReminder") === "on";
    const reminderDaysBefore = parseInt((formData.get("reminderDaysBefore") as string) || "1", 10);
    const enableInvoice = formData.get("enableInvoice") === "on";
    const autoSendInvoice = formData.get("autoSendInvoice") === "on";
    const enablePaymentReminder = formData.get("enablePaymentReminder") === "on";

    const name = sanitizeInput(rawName);
    const email = rawEmail ? sanitizeInput(rawEmail).toLowerCase() : "";
    const phone = sanitizeInput(rawPhone);
    const address = sanitizeInput(rawAddress);

    // Validação profunda dos dados
    const validation = validateClientData({
      name,
      phone,
      email,
      address,
      reminderDaysBefore,
      enableInvoice,
      autoSendInvoice,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || "Invalid client data provided.";
      return {
        success: false,
        message: firstError,
        errors: validation.errors,
      };
    }

    await prisma.client.create({
      data: {
        userId: session.userId,
        name,
        email: email || null,
        phone,
        address,
        defaultPrice: 0,
        enableAppointmentReminder,
        reminderDaysBefore,
        enableInvoice,
        autoSendInvoice,
        enablePaymentReminder,
      },
    });

    revalidatePath("/clients");
    return { success: true, message: "Client created successfully!" };
  } catch (error) {
    console.error("Failed to create client:", error);
    return { success: false, message: "An error occurred while saving the client. Please try again." };
  }
}

export async function deleteClient(id: string) {
  const session = await getSession();

  if (!session?.userId) {
    return { success: false, message: "Unauthorized: Please log in to continue." };
  }

  try {
    const deleted = await prisma.client.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (deleted.count === 0) {
      return { success: false, message: "Client not found or unauthorized." };
    }
  } catch (error) {
    console.error("Failed to delete client:", error);
    return { success: false, message: "An error occurred while deleting the client. Please try again." };
  }

  // Revalidate and Redirect must stay out of the try/catch
  revalidatePath("/clients");
  redirect("/clients");
}
