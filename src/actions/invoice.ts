"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper function to generate unique invoice numbers (e.g. INV-2026-0042)
async function generateInvoiceNumber(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Count existing invoices for this user in the current year
  const count = await prisma.invoice.count({
    where: {
      client: {
        userId,
      },
    },
  });

  const sequentialNumber = String(count + 1).padStart(4, "0");
  return `INV-${currentYear}-${sequentialNumber}`;
}

export async function createInvoiceForAppointment(appointmentId: string) {
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

    // Prevent duplicate invoices for the same appointment
    if (appointment.invoice) {
      return { success: false, message: "An invoice already exists for this appointment." };
    }

    const invoiceNumber = await generateInvoiceNumber(session.userId);

    // Default due date is set to 7 days after the appointment date
    const dueDate = new Date(appointment.date);
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await prisma.invoice.create({
      data: {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        invoiceNumber,
        amount: appointment.price,
        dueDate,
        status: "PENDING",
      },
    });

    revalidatePath("/invoices");
    revalidatePath("/schedule");
    revalidatePath(`/clients/${appointment.clientId}`);

    return { success: true, message: "Invoice generated successfully!", invoice };
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return { success: false, message: "An error occurred while creating the invoice." };
  }
}

export async function getInvoices() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.invoice.findMany({
    where: {
      client: {
        userId: session.userId,
      },
    },
    include: {
      client: true,
      appointment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateInvoiceStatus(
  invoiceId: string,
  newStatus: "PENDING" | "PAID" | "OVERDUE",
  paidAtDate?: string,
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          userId: session.userId,
        },
      },
    });

    if (!invoice) {
      return { success: false, message: "Invoice not found or unauthorized." };
    }

    // Determine paidAt timestamp
    let paidAtValue: Date | null = null;
    if (newStatus === "PAID") {
      paidAtValue = paidAtDate ? new Date(paidAtDate) : new Date();
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAt: paidAtValue,
      },
    });

    revalidatePath("/invoices");
    revalidatePath(`/clients/${invoice.clientId}`);

    return { success: true, message: `Invoice marked as ${newStatus.toLowerCase()}!` };
  } catch (error) {
    console.error("Failed to update invoice status:", error);
    return { success: false, message: "An error occurred while updating status." };
  }
}
