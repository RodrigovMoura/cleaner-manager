import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { getAppointmentReminderEmailHtml, getOverduePaymentEmailHtml } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  // 1. Validar autenticação do Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    remindersSent: 0,
    overdueNoticesSent: 0,
    errors: [] as string[],
  };

  const now = new Date();

  try {
    // -------------------------------------------------------------
    // TASK 1: Appointment Reminders
    // -------------------------------------------------------------
    const scheduledAppointments = await prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        reminderSentAt: null,
        client: {
          enableAppointmentReminder: true,
          email: { not: null },
        },
      },
      include: {
        client: true,
      },
    });

    for (const apt of scheduledAppointments) {
      if (!apt.client.email) continue;

      const aptDate = new Date(apt.date);
      const daysUntil = Math.ceil((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Dispara se o agendamento cair dentro da janela de dias configurada no cliente
      if (daysUntil > 0 && daysUntil <= apt.client.reminderDaysBefore) {
        const formattedDate = aptDate.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedTime = aptDate.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: apt.client.email,
          subject: `Upcoming Cleaning Reminder - ${formattedDate}`,
          html: getAppointmentReminderEmailHtml({
            clientName: apt.client.name,
            formattedDate,
            formattedTime,
            address: apt.client.address || "Your scheduled address",
          }),
        });

        if (!error) {
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminderSentAt: new Date() },
          });
          results.remindersSent++;
        } else {
          results.errors.push(`Reminder error (${apt.id}): ${error.message}`);
        }
      }
    }

    // -------------------------------------------------------------
    // TASK 2: Overdue Invoices & Payment Chase
    // -------------------------------------------------------------
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: now },
        client: {
          enablePaymentReminder: true,
          email: { not: null },
        },
      },
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const inv of pendingInvoices) {
      if (!inv.client.email) continue;

      // Evita múltiplos disparos no mesmo intervalo (chase cooldown de 3 dias)
      const daysSinceLastChase = inv.lastChasedAt
        ? (now.getTime() - new Date(inv.lastChasedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastChase >= 3) {
        const dueDateFormatted = new Date(inv.dueDate).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const paymentDetails = {
          accountName: inv.paymentAccountName || inv.client.user.bankAccountName,
          bsb: inv.paymentBsb || inv.client.user.bankBsb,
          accountNumber: inv.paymentAccountNo || inv.client.user.bankAccountNo,
          payId: inv.paymentPayId || inv.client.user.payId,
        };

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: inv.client.email,
          subject: `Payment Reminder: Invoice ${inv.invoiceNumber}`,
          html: getOverduePaymentEmailHtml({
            clientName: inv.client.name,
            invoiceNumber: inv.invoiceNumber,
            amount: Number(inv.amount),
            dueDateStr: dueDateFormatted,
            bankDetails: paymentDetails,
          }),
        });

        if (!error) {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              status: "OVERDUE",
              lastChasedAt: new Date(),
            },
          });
          results.overdueNoticesSent++;
        } else {
          results.errors.push(`Overdue error (${inv.id}): ${error.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), results });
  } catch (error) {
    console.error("Cron sweep execution error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during sweep" }, { status: 500 });
  }
}
