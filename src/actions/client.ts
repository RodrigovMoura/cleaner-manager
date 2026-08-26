"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function getClients() {
  try {
    const currSession = await getSession();
    return await prisma.client.findMany({
      where: { userId: currSession?.userId || "" },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to load client list.");
  }
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
    },
  });
}

export async function updateClient(id: string, formData: FormData) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    const enableAppointmentReminder = formData.get("enableAppointmentReminder") === "on";
    const reminderDaysBefore = parseInt((formData.get("reminderDaysBefore") as string) || "1", 10);
    const enableInvoice = formData.get("enableInvoice") === "on";
    const autoSendInvoice = formData.get("autoSendInvoice") === "on";
    const enablePaymentReminder = formData.get("enablePaymentReminder") === "on";

    if (!name || name.trim() === "") {
      return { success: false, message: "Client name is required." };
    }

    await prisma.client.updateMany({
      where: {
        id,
        userId: session.userId,
      },
      data: {
        userId: session.userId,
        name,
        email: email || null,
        phone: phone,
        address: address,
        defaultPrice: 0o0,
        enableAppointmentReminder,
        reminderDaysBefore,
        enableInvoice,
        autoSendInvoice,
        enablePaymentReminder,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}/edit`);

    return { success: true, message: "Client updated successfully!" };
  } catch (error) {
    console.error("Failed to update client:", error);
    return { success: false, message: "An error occurred while updating the client. Please try again." };
  }
}

export async function createClient(formData: FormData) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      throw new Error("Unauthorized: Please log in to continue.");
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    // Toggle values from checkboxes
    const enableAppointmentReminder = formData.get("enableAppointmentReminder") === "on";
    const reminderDaysBefore = parseInt((formData.get("reminderDaysBefore") as string) || "1", 10);
    const enableInvoice = formData.get("enableInvoice") === "on";
    const autoSendInvoice = formData.get("autoSendInvoice") === "on";
    const enablePaymentReminder = formData.get("enablePaymentReminder") === "on";

    if (!name || name.trim() === "") {
      throw new Error("Client name is required.");
    }

    await prisma.client.create({
      data: {
        userId: session.userId,
        name,
        email: email || null,
        phone: phone,
        address: address,
        defaultPrice: 0o0,
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
