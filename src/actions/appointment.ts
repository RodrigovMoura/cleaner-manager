"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail, generateInvoiceNumber } from "./invoice";
import { Prisma, AppointmentStatus, PaymentMethod } from "@prisma/client";
import { addMonths } from "@/lib/date";

export async function createAppointment(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    const clientId = formData.get("clientId") as string;
    const dateStr = formData.get("date") as string;
    const priceStr = formData.get("price") as string;
    const recurrence = (formData.get("recurrence") as string) || "none";
    const occurrencesStr = formData.get("occurrences") as string;

    if (!clientId || !dateStr || !priceStr) {
      return { success: false, message: "Client, Date, and Price are required." };
    }

    const baseDate = new Date(dateStr);
    const price = parseFloat(priceStr);

    if (isNaN(baseDate.getTime())) {
      return { success: false, message: "Invalid date format." };
    }

    if (baseDate.getTime() < Date.now() - 5 * 60 * 1000) {
      return { success: false, message: "Appointment date cannot be in the past." };
    }

    if (isNaN(price) || price < 0) {
      return { success: false, message: "Invalid price format." };
    }

    let occurrences = 1;
    if (recurrence === "weekly" || recurrence === "biweekly" || recurrence === "monthly") {
      const parsed = parseInt(occurrencesStr || "1", 10);
      occurrences = isNaN(parsed) ? 1 : Math.max(1, Math.min(parsed, 52));
    }

    // Verify client belongs to current user (multi-tenant security)
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
    });
    if (!client) {
      return { success: false, message: "Client not found or unauthorized." };
    }

    const appointmentsData: Prisma.AppointmentCreateManyInput[] = [];

    for (let i = 0; i < occurrences; i++) {
      let appointmentDate: Date;
      if (recurrence === "weekly") {
        appointmentDate = new Date(baseDate);
        appointmentDate.setDate(baseDate.getDate() + i * 7);
      } else if (recurrence === "biweekly") {
        appointmentDate = new Date(baseDate);
        appointmentDate.setDate(baseDate.getDate() + i * 14);
      } else if (recurrence === "monthly") {
        appointmentDate = addMonths(baseDate, i);
      } else {
        appointmentDate = new Date(baseDate);
      }

      const clientHourlyRate = client.hourlyRate ? Number(client.hourlyRate) : 50;
      const estimatedDuration = clientHourlyRate > 0 ? Math.round((Number(price) / clientHourlyRate) * 60) : undefined;

      appointmentsData.push({
        clientId,
        date: appointmentDate,
        price,
        durationMinutes: estimatedDuration,
        status: AppointmentStatus.SCHEDULED,
      });
    }

    await prisma.appointment.createMany({
      data: appointmentsData,
    });

    revalidatePath("/schedule");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/calendar");
    revalidatePath("/");

    const frequencyLabel =
      recurrence === "weekly"
        ? "weekly "
        : recurrence === "biweekly"
        ? "bi-weekly "
        : recurrence === "monthly"
        ? "monthly "
        : "";

    return {
      success: true,
      message:
        occurrences > 1
          ? `Successfully scheduled ${occurrences} ${frequencyLabel}appointments!`
          : "Appointment scheduled successfully!",
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
  paymentMethod?: "BANK_TRANSFER" | "CASH",
  actualPrice?: number,
  durationMinutes?: number,
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

    const effectivePaymentMethod =
      newStatus === "COMPLETED"
        ? (paymentMethod ?? (appointment.client.preferredPaymentMethod as PaymentMethod) ?? "BANK_TRANSFER")
        : null;

    const finalPrice =
      newStatus === "COMPLETED" && actualPrice !== undefined && !isNaN(actualPrice) && actualPrice >= 0
        ? new Prisma.Decimal(actualPrice)
        : appointment.price;

    const finalDurationMinutes =
      newStatus === "COMPLETED" && durationMinutes !== undefined && !isNaN(durationMinutes) && durationMinutes >= 0
        ? durationMinutes
        : appointment.durationMinutes;

    let createdInvoiceId: string | null = null;
    let emailSentSuccess: boolean | null = null;
    let emailErrorMessage: string | null = null;

    // Use transaction so appointment status and invoice generation remain consistent
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: newStatus,
          ...(newStatus === "COMPLETED"
            ? {
                paymentMethod: effectivePaymentMethod,
                price: finalPrice,
                durationMinutes: finalDurationMinutes,
              }
            : newStatus === "SCHEDULED"
              ? { paymentMethod: null }
              : {}),
        },
      });

      // Auto-generate invoice ONLY if completed by BANK_TRANSFER, client requires invoice, and none exists yet
      if (
        newStatus === "COMPLETED" &&
        effectivePaymentMethod === "BANK_TRANSFER" &&
        appointment.client.enableInvoice &&
        !appointment.invoice
      ) {
        const invoiceNumber = await generateInvoiceNumber(session.userId);
        const dueDate = new Date(appointment.date);
        dueDate.setDate(dueDate.getDate() + 7);

        const user = await tx.user.findUnique({
          where: { id: session.userId },
          select: {
            bankAccountName: true,
            bankBsb: true,
            bankAccountNo: true,
            payId: true,
          },
        });

        const createdInvoice = await tx.invoice.create({
          data: {
            appointmentId: appointment.id,
            clientId: appointment.clientId,
            userId: session.userId,
            invoiceNumber,
            amount: finalPrice,
            dueDate,
            status: "PENDING",
            durationMinutes: finalDurationMinutes,
            hourlyRate: appointment.client.hourlyRate,
            paymentAccountName: user?.bankAccountName,
            paymentBsb: user?.bankBsb,
            paymentAccountNo: user?.bankAccountNo,
            paymentPayId: user?.payId,
          },
        });

        createdInvoiceId = createdInvoice.id;
      } else if (
        newStatus === "COMPLETED" &&
        effectivePaymentMethod === "BANK_TRANSFER" &&
        appointment.invoice &&
        appointment.invoice.status === "PENDING"
      ) {
        // Keep existing pending invoice synced with adjusted price and duration
        await tx.invoice.update({
          where: { id: appointment.invoice.id },
          data: {
            amount: finalPrice,
            durationMinutes: finalDurationMinutes,
            hourlyRate: appointment.client.hourlyRate,
          },
        });
      }
    });

    // If autoSendInvoice is active and client has an email, send after transaction commits
    if (createdInvoiceId && appointment.client.autoSendInvoice && appointment.client.email) {
      const emailResult = await sendInvoiceEmail(createdInvoiceId);
      if (emailResult && !emailResult.success) {
        emailSentSuccess = false;
        emailErrorMessage = emailResult.message;
      } else if (emailResult && emailResult.success) {
        emailSentSuccess = true;
      }
    }

    revalidatePath("/schedule");
    revalidatePath("/invoices");
    revalidatePath(`/clients/${appointment.clientId}`);
    revalidatePath("/");

    let message =
      newStatus === "COMPLETED" && effectivePaymentMethod === "CASH"
        ? "Cleaning marked as completed (paid in cash, no invoice needed)!"
        : `Appointment marked as ${newStatus.toLowerCase()}!`;

    if (createdInvoiceId) {
      if (emailSentSuccess === true) {
        message = "Cleaning completed, invoice created and sent automatically!";
      } else if (emailSentSuccess === false) {
        message = `Cleaning completed and invoice created, but email could not be sent (${emailErrorMessage}).`;
      } else {
        message = "Cleaning completed and invoice created!";
      }
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Failed to update appointment status:", error);
    return { success: false, message: "An error occurred while updating status." };
  }
}

export type CancelScope =
  | "THIS_ONLY"
  | "ALL_FOR_CLIENT"
  | "SAME_RECURRENCE"
  | "ALL_WITHOUT_EXCEPTION";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function partitionClientScheduledAppointments<
  T extends { id: string; date: Date | string; createdAt?: Date | string },
>(targetAppointment: T, allScheduled: T[]) {
  const targetDate = new Date(targetAppointment.date);
  const isValidTargetDate = !isNaN(targetDate.getTime());

  if (!isValidTargetDate || allScheduled.length <= 1) {
    return {
      matchingAppointments: allScheduled,
      otherAppointments: [] as T[],
      weekdayName: isValidTargetDate ? WEEKDAY_NAMES[targetDate.getDay()] : "this day",
      recurrenceLabel: null as string | null,
      otherWeekdays: [] as string[],
    };
  }

  const targetWeekday = targetDate.getDay();
  const targetDayOfMonth = targetDate.getDate();
  const weekdayName = WEEKDAY_NAMES[targetWeekday];

  const sameWeekday = allScheduled.filter((apt) => {
    const d = new Date(apt.date);
    return !isNaN(d.getTime()) && d.getDay() === targetWeekday;
  });

  const diffWeekday = allScheduled.filter((apt) => {
    const d = new Date(apt.date);
    return !isNaN(d.getTime()) && d.getDay() !== targetWeekday;
  });

  let matchingAppointments = sameWeekday;
  let otherAppointments = diffWeekday;
  let recurrenceLabel: string | null = null;

  // Check if target is part of a monthly series (different weekdays, same day of month)
  if (sameWeekday.length === 1 && diffWeekday.length > 0) {
    const sameDayOfMonth = allScheduled.filter((apt) => {
      const d = new Date(apt.date);
      return !isNaN(d.getTime()) && d.getDate() === targetDayOfMonth;
    });

    if (sameDayOfMonth.length > 1) {
      matchingAppointments = sameDayOfMonth;
      otherAppointments = allScheduled.filter((apt) => {
        const d = new Date(apt.date);
        return !isNaN(d.getTime()) && d.getDate() !== targetDayOfMonth;
      });
      recurrenceLabel = "monthly";
    }
  } else if (sameWeekday.length > 1 && targetAppointment.createdAt) {
    // Check if there are two distinct bi-weekly schedules on the same weekday (off-weeks created in separate batches)
    const targetCreatedTime = new Date(targetAppointment.createdAt).getTime();
    if (!isNaN(targetCreatedTime)) {
      const sameBatch = sameWeekday.filter(
        (apt) =>
          apt.createdAt &&
          Math.abs(new Date(apt.createdAt).getTime() - targetCreatedTime) < 5000,
      );
      const diffBatch = sameWeekday.filter(
        (apt) =>
          apt.createdAt &&
          Math.abs(new Date(apt.createdAt).getTime() - targetCreatedTime) >= 5000,
      );

      if (sameBatch.length >= 2 && diffBatch.length >= 1) {
        const sortedBatch = [...sameBatch].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        const batchGapDays = Math.round(
          (new Date(sortedBatch[1].date).getTime() - new Date(sortedBatch[0].date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const hasOffWeekInDiffBatch = diffBatch.some((apt) => {
          const daysFromTarget = Math.abs(
            Math.round(
              (new Date(apt.date).getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
          return daysFromTarget % 14 !== 0;
        });

        if (batchGapDays >= 13 && batchGapDays <= 15 && hasOffWeekInDiffBatch) {
          matchingAppointments = sameBatch;
          otherAppointments = [...diffWeekday, ...diffBatch];
          recurrenceLabel = "bi-weekly";
        }
      }
    }
  }

  // Ensure targetAppointment is always included in matchingAppointments
  if (!matchingAppointments.some((apt) => apt.id === targetAppointment.id)) {
    matchingAppointments = [targetAppointment, ...matchingAppointments];
  }

  // Detect recurrence frequency among matchingAppointments if not already set
  if (!recurrenceLabel && matchingAppointments.length >= 2) {
    const sorted = [...matchingAppointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const diffDays = Math.round(
      (new Date(sorted[1].date).getTime() - new Date(sorted[0].date).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (diffDays >= 6 && diffDays <= 8) {
      recurrenceLabel = "weekly";
    } else if (diffDays >= 13 && diffDays <= 15) {
      recurrenceLabel = "bi-weekly";
    } else if (diffDays >= 27 && diffDays <= 32) {
      recurrenceLabel = "monthly";
    }
  }

  const otherWeekdays = Array.from(
    new Set(
      otherAppointments
        .map((apt) => {
          const d = new Date(apt.date);
          return !isNaN(d.getTime()) ? WEEKDAY_NAMES[d.getDay()] : null;
        })
        .filter((w): w is (typeof WEEKDAY_NAMES)[number] => Boolean(w)),
    ),
  );

  return {
    matchingAppointments,
    otherAppointments,
    weekdayName,
    recurrenceLabel,
    otherWeekdays,
  };
}

export async function cancelAppointment(
  appointmentId: string,
  scope: CancelScope = "THIS_ONLY",
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, message: "Unauthorized: Please log in to continue." };
    }

    if (!appointmentId) {
      return { success: false, message: "Appointment ID is required." };
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
      },
    });

    if (!appointment) {
      return { success: false, message: "Appointment not found or unauthorized." };
    }

    if (scope === "THIS_ONLY") {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });

      revalidatePath("/schedule");
      revalidatePath(`/clients/${appointment.clientId}`);
      revalidatePath("/calendar");
      revalidatePath("/invoices");
      revalidatePath("/");

      return {
        success: true,
        message: "Appointment cancelled successfully.",
        count: 1,
      };
    }

    const allScheduled =
      (await prisma.appointment.findMany({
        where: {
          clientId: appointment.clientId,
          status: AppointmentStatus.SCHEDULED,
          client: {
            userId: session.userId,
          },
        },
        orderBy: {
          date: "asc",
        },
      })) || [];

    const {
      matchingAppointments,
      otherAppointments,
      weekdayName,
      recurrenceLabel,
      otherWeekdays,
    } = partitionClientScheduledAppointments(appointment, allScheduled);

    if (scope === "ALL_FOR_CLIENT" && otherAppointments.length > 0) {
      const otherDaysText =
        otherWeekdays.length > 0 ? otherWeekdays.join(", ") : "other dates";

      return {
        success: false,
        requiresConfirmation: true,
        weekdayName,
        recurrenceLabel,
        otherWeekdays,
        matchingCount: matchingAppointments.length,
        otherCount: otherAppointments.length,
        totalCount: allScheduled.length,
        message: `There are other appointments scheduled on ${otherDaysText}. Would you like to cancel only the ${weekdayName}${recurrenceLabel ? ` (${recurrenceLabel})` : ""} appointments or all appointments without exception?`,
      };
    }

    if (scope === "SAME_RECURRENCE") {
      const matchingIds = matchingAppointments.map((apt) => apt.id);
      if (!matchingIds.includes(appointmentId)) {
        matchingIds.push(appointmentId);
      }

      const result = await prisma.appointment.updateMany({
        where: {
          id: { in: matchingIds },
          clientId: appointment.clientId,
          status: AppointmentStatus.SCHEDULED,
          client: {
            userId: session.userId,
          },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });

      revalidatePath("/schedule");
      revalidatePath(`/clients/${appointment.clientId}`);
      revalidatePath("/calendar");
      revalidatePath("/invoices");
      revalidatePath("/");

      return {
        success: true,
        message: `Successfully cancelled ${result.count} ${weekdayName}${recurrenceLabel ? ` (${recurrenceLabel})` : ""} scheduled cleaning(s) for ${appointment.client.name}.`,
        count: result.count,
      };
    }

    const result = await prisma.appointment.updateMany({
      where: {
        clientId: appointment.clientId,
        status: AppointmentStatus.SCHEDULED,
        client: {
          userId: session.userId,
        },
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    revalidatePath("/schedule");
    revalidatePath(`/clients/${appointment.clientId}`);
    revalidatePath("/calendar");
    revalidatePath("/invoices");
    revalidatePath("/");

    return {
      success: true,
      message: `Successfully cancelled all ${result.count} scheduled cleanings for ${appointment.client.name}.`,
      count: result.count,
    };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    return { success: false, message: "An error occurred while cancelling. Please try again." };
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
