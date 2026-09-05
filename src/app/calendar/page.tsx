import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalendarView, { CalendarAppointment } from "./CalendarView";

export const metadata = {
  title: "Calendar",
  description: "Visual schedule and demand calendar for cleaning services.",
};

export default async function CalendarPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const rawAppointments = await prisma.appointment.findMany({
    where: {
      client: {
        userId: session.userId,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          email: true,
        },
      },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          amount: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  const appointments: CalendarAppointment[] = rawAppointments.map((apt) => ({
    id: apt.id,
    date: apt.date.toISOString(),
    price: Number(apt.price),
    status: apt.status,
    clientId: apt.clientId,
    client: apt.client,
    invoice: apt.invoice
      ? {
          id: apt.invoice.id,
          invoiceNumber: apt.invoice.invoiceNumber,
          status: apt.invoice.status,
          amount: Number(apt.invoice.amount),
        }
      : null,
  }));

  return (
    <div className='max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      <CalendarView appointments={appointments} />
    </div>
  );
}
