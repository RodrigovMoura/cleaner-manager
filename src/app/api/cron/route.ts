import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { getAppointmentReminderEmailHtml, getOverduePaymentEmailHtml } from "@/lib/email-templates";
import { resolveTimezone, formatInTimezone, formatTimeInTimezone } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  // 1. Validate Cron authentication
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || cronSecret.trim() === "" || authHeader !== `Bearer ${cronSecret}`) {
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
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const apt of scheduledAppointments) {
      if (!apt.client.email) continue;

      const userTz = resolveTimezone(apt.client.user?.timezone);
      const aptDate = new Date(apt.date);
      const daysUntil = Math.ceil((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Trigger if the appointment falls within the reminder window configured for the client
      if (daysUntil > 0 && daysUntil <= apt.client.reminderDaysBefore) {
        const formattedDate = formatInTimezone(apt.date, userTz, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedTime = formatTimeInTimezone(apt.date, userTz);

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: apt.client.email,
          replyTo: REPLY_TO_EMAIL,
          subject: `Upcoming Cleaning Reminder - ${formattedDate}`,
          html: getAppointmentReminderEmailHtml({
            clientName: apt.client.name,
            formattedDate,
            formattedTime,
            address: apt.client.address || "Your scheduled address",
            price: Number(apt.price),
            paymentMethod: apt.paymentMethod ?? apt.client.preferredPaymentMethod,
            hourlyRate: Number(apt.client.hourlyRate ?? 50),
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

      // Prevents multiple triggers within the same interval (3-day chase cooldown)
      const daysSinceLastChase = inv.lastChasedAt
        ? (now.getTime() - new Date(inv.lastChasedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastChase >= 3) {
        const userTz = resolveTimezone(inv.client.user?.timezone);
        const dueDateFormatted = formatInTimezone(inv.dueDate, userTz, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const paymentDetails = {
          accountName: inv.client.user.bankAccountName || inv.paymentAccountName,
          bsb: inv.client.user.bankBsb || inv.paymentBsb,
          accountNumber: inv.client.user.bankAccountNo || inv.paymentAccountNo,
          payId: inv.client.user.payId || inv.paymentPayId,
        };

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: inv.client.email,
          replyTo: REPLY_TO_EMAIL,
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
