"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail } from "./invoice";
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

    if (baseDate.getTime() < Date.now()) {
      return { success: false, message: "Appointment date cannot be in the past." };
    }

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

export async function getAppointments(view: "upcoming" | "history" = "upcoming") {
  const session = await getSession();
  if (!session?.userId) {
    return [];
  }

  const isHistory = view === "history";

  return await prisma.appointment.findMany({
    where: {
      client: {
        userId: session.userId,
      },
      status: isHistory
        ? { in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] }
        : AppointmentStatus.SCHEDULED,
    },
    include: {
      client: true,
      invoice: true,
    },
    orderBy: {
      date: isHistory ? "desc" : "asc",
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
        where: { client: { userId: session.userId } },
      });

      const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, "0")}`;
      const dueDate = new Date(appointment.date);
      dueDate.setDate(dueDate.getDate() + 7);

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          bankAccountName: true,
          bankBsb: true,
          bankAccountNo: true,
          payId: true,
        },
      });

      const createdInvoice = await prisma.invoice.create({
        data: {
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          invoiceNumber,
          amount: appointment.price,
          dueDate,
          status: "PENDING",
          paymentAccountName: user?.bankAccountName,
          paymentBsb: user?.bankBsb,
          paymentAccountNo: user?.bankAccountNo,
          paymentPayId: user?.payId,
        },
      });

      // Se autoSendInvoice estiver ativo e cliente tiver email, envia automaticamente
      if (appointment.client.autoSendInvoice && appointment.client.email) {
        // Chamada interna assíncrona para envio imediato
        await sendInvoiceEmail(createdInvoice.id);
      }
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

export async function getAppointmentById(appointmentId: string) {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  return await prisma.appointment.findFirst({
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
}

export async function updateAppointment(appointmentId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    if (!appointmentId) {
      return { success: false, message: "Appointment ID is required." };
    }

    const dateStr = formData.get("date") as string;
    const priceStr = formData.get("price") as string | null;

    if (!dateStr || dateStr.trim() === "") {
      return { success: false, message: "Date and time are required." };
    }

    const newDate = new Date(dateStr);
    if (isNaN(newDate.getTime())) {
      return { success: false, message: "Invalid date or time provided." };
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

    let newPrice = appointment.price;
    if (priceStr !== null && priceStr !== undefined && priceStr.trim() !== "") {
      const parsedPrice = parseFloat(priceStr);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return { success: false, message: "Price must be a valid positive number." };
      }
      newPrice = new Prisma.Decimal(parsedPrice);
    }

    const dateChanged = newDate.getTime() !== new Date(appointment.date).getTime();

    if (
      dateChanged &&
      appointment.status === AppointmentStatus.SCHEDULED &&
      newDate.getTime() < Date.now() - 5 * 60 * 1000
    ) {
      return { success: false, message: "Appointment date cannot be in the past." };
    }

    const reminderReset = dateChanged ? { reminderSentAt: null } : {};

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: newDate,
        price: newPrice,
        ...reminderReset,
      },
    });

    if (appointment.invoice && appointment.invoice.status === "PENDING") {
      const newDueDate = new Date(newDate);
      newDueDate.setDate(newDueDate.getDate() + 7);

      await prisma.invoice.update({
        where: { id: appointment.invoice.id },
        data: {
          dueDate: newDueDate,
          amount: newPrice,
        },
      });
    }

    revalidatePath("/schedule");
    revalidatePath(`/schedule/${appointmentId}/edit`);
    revalidatePath("/invoices");
    revalidatePath(`/clients/${appointment.clientId}`);
    revalidatePath("/");

    return { success: true, message: "Appointment updated successfully!" };
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return { success: false, message: "An error occurred while updating the appointment. Please try again." };
  }
}
