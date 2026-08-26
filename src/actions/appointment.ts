"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma, AppointmentStatus } from "@prisma/client";

export async function createAppointment(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const clientId = formData.get("clientId") as string;
    const dateStr = formData.get("date") as string;
    const priceStr = formData.get("price") as string;
    const recurrence = formData.get("recurrence") as string;
    const occurrencesStr = formData.get("occurrences") as string;

    if (!clientId || !dateStr || !priceStr) {
      return { success: false, message: "Client, Date, and Price are required." };
    }

    const baseDate = new Date(dateStr);
    const price = parseFloat(priceStr);
    const occurrences = recurrence === "biweekly" ? parseInt(occurrencesStr || "1", 10) : 1;

    if (isNaN(price)) {
      return { success: false, message: "Invalid price format." };
    }

    const appointmentsData: Prisma.AppointmentCreateManyInput[] = [];

    for (let i = 0; i < occurrences; i++) {
      const appointmentDate = new Date(baseDate);
      appointmentDate.setDate(baseDate.getDate() + i * 14);

      appointmentsData.push({
        clientId,
        date: appointmentDate,
        price,
        status: AppointmentStatus.SCHEDULED,
      });
    }

    await prisma.appointment.createMany({
      data: appointmentsData,
    });

    revalidatePath("/schedule");
    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      message:
        occurrences > 1 ? `Successfully scheduled ${occurrences} appointments!` : "Appointment scheduled successfully!",
    };
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return { success: false, message: "An error occurred while scheduling. Please try again." };
  }
}

export async function getAppointments() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.appointment.findMany({
    where: {
      client: {
        userId: session.userId,
      },
    },
    include: {
      client: true,
    },
    orderBy: {
      date: "asc",
    },
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED",
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        client: {
          userId: session.userId,
        },
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    if (!appointment) {
      return { success: false, message: "Appointment not found or unauthorized." };
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus },
    });

    // Auto-generate invoice if completed, client requires invoice, and none exists yet
    if (newStatus === "COMPLETED" && appointment.client.enableInvoice && !appointment.invoice) {
      const currentYear = new Date().getFullYear();
      const count = await prisma.invoice.count({
        where: {
          client: {
            userId: session.userId,
          },
        },
      });

      const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, "0")}`;
      const dueDate = new Date(appointment.date);
      dueDate.setDate(dueDate.getDate() + 7);

      await prisma.invoice.create({
        data: {
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          invoiceNumber,
          amount: appointment.price,
          dueDate,
          status: "PENDING",
        },
      });
    }

    revalidatePath("/schedule");
    revalidatePath("/invoices");
    revalidatePath(`/clients/${appointment.clientId}`);

    return { success: true, message: `Appointment marked as ${newStatus.toLowerCase()}!` };
  } catch (error) {
    console.error("Failed to update appointment status:", error);
    return { success: false, message: "An error occurred while updating status." };
  }
}
