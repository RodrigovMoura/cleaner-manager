"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { resend, FROM_EMAIL } from "@/lib/email";
import { getInvoiceEmailHtml } from "@/lib/email-templates";
import { generateInvoicePdfBuffer } from "@/lib/pdf";

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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        bankAccountName: true,
        bankBsb: true,
        bankAccountNo: true,
        payId: true,
      },
    });

    const invoice = await prisma.invoice.create({
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
    return [];
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

export async function sendInvoiceEmail(invoiceId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        message: "Resend API key is not configured. Please set RESEND_API_KEY in your environment variables.",
      };
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: { userId: session.userId },
      },
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, message: "Invoice not found or unauthorized." };
    }

    if (!invoice.client.email) {
      return { success: false, message: "Client does not have an email address configured." };
    }

    // Resolve payment details with snapshot first, then fallback to current user settings
    const paymentDetails = {
      accountName: invoice.paymentAccountName || invoice.client.user.bankAccountName,
      bsb: invoice.paymentBsb || invoice.client.user.bankBsb,
      accountNumber: invoice.paymentAccountNo || invoice.client.user.bankAccountNo,
      payId: invoice.paymentPayId || invoice.client.user.payId,
    };

    // 1. Gera o PDF em Buffer
    const pdfBuffer = await generateInvoicePdfBuffer({
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        client: {
          name: invoice.client.name,
          email: invoice.client.email,
          phone: invoice.client.phone,
          address: invoice.client.address,
        },
        status: invoice.status,
        paymentAccountName: paymentDetails.accountName,
        paymentBsb: paymentDetails.bsb,
        paymentAccountNo: paymentDetails.accountNumber,
        paymentPayId: paymentDetails.payId,
      },
    });

    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // 2. Dispara via Resend com o PDF anexado
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: invoice.client.email,
      subject: `Tax Invoice ${invoice.invoiceNumber} - Cleaning Service`,
      html: getInvoiceEmailHtml({
        clientName: invoice.client.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        dueDateStr: dueDateFormatted,
        bankDetails: paymentDetails,
      }),
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        message: error.message || "Failed to send invoice email via Resend.",
      };
    }

    // 3. Atualiza registro com data de envio
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { sentAt: new Date() },
    });

    revalidatePath("/invoices");
    revalidatePath(`/clients/${invoice.clientId}`);

    return { success: true, message: `Invoice ${invoice.invoiceNumber} sent successfully to ${invoice.client.email}!` };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while sending the email.";
    return { success: false, message: errorMessage };
  }
}
