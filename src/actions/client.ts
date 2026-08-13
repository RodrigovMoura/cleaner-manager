"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClients(userId: string) {
  try {
    return await prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to load client list.");
  }
}

export async function createClient(data: {
  userId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  defaultPrice: number;
  enableAppointmentReminder?: boolean;
  reminderDaysBefore?: number;
  enableInvoice?: boolean;
  autoSendInvoice?: boolean;
  enablePaymentReminder?: boolean;
}) {
  try {
    const newClient = await prisma.client.create({
      data,
    });

    revalidatePath("/clients");
    return { success: true, client: newClient };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Error registering client." };
  }
}
