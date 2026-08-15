"use server";

import { prisma } from "@/lib/prisma";
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
