import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AutomationsDashboard from "./AutomationsDashboard";

export const metadata = {
  title: "Automations",
  description: "Manage client automation rules and email dispatch safeguards.",
};

export default async function AutomationsPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      enableAppointmentReminder: true,
      reminderDaysBefore: true,
      enableInvoice: true,
      autoSendInvoice: true,
      enablePaymentReminder: true,
      _count: {
        select: {
          appointments: true,
          invoices: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalClients = clients.length;
  const activeRemindersCount = clients.filter((c) => c.enableAppointmentReminder).length;
  const autoSendCount = clients.filter((c) => c.autoSendInvoice).length;
  const paymentChaseCount = clients.filter((c) => c.enablePaymentReminder).length;
  const missingEmailCount = clients.filter(
    (c) => (!c.email || c.email.trim().length === 0) && (c.enableAppointmentReminder || c.enablePaymentReminder)
  ).length;

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6 sm:space-y-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>
            Automations & Safeguards
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>
            Centralized control over email dispatches, reminders, and billing automation rules.
          </p>
        </div>
        <div className='flex items-center gap-2.5'>
          <Link
            href='/clients/new'
            className='inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs'>
            <span>＋</span>
            <span>New Client</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {/* Card 1: Pre-Cleaning Reminders */}
        <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3'>
          <div className='flex items-center justify-between text-gray-500'>
            <span className='text-xs font-semibold uppercase tracking-wider'>Reminders</span>
            <span className='text-lg'>🔔</span>
          </div>
          <div>
            <div className='text-2xl sm:text-3xl font-bold text-gray-900'>
              {activeRemindersCount}{" "}
              <span className='text-xs font-normal text-gray-400'>/ {totalClients}</span>
            </div>
            <p className='text-xs text-gray-500 mt-0.5'>Pre-cleaning notices active</p>
          </div>
        </div>

        {/* Card 2: Auto-Send Invoices (Critical / Highlighted) */}
        <div
          className={`border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3 ${
            autoSendCount > 0
              ? "bg-amber-50/40 border-amber-200"
              : "bg-white border-gray-200"
          }`}>
          <div className='flex items-center justify-between text-gray-500'>
            <span className='text-xs font-semibold uppercase tracking-wider text-amber-900'>
              Auto-Send
            </span>
            <span className='text-lg'>⚡</span>
          </div>
          <div>
            <div className='text-2xl sm:text-3xl font-bold text-amber-950'>
              {autoSendCount}{" "}
              <span className='text-xs font-normal text-gray-400'>/ {totalClients}</span>
            </div>
            <p className='text-xs text-amber-800/80 mt-0.5'>Direct email on finish</p>
          </div>
        </div>

        {/* Card 3: Overdue Chasers */}
        <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3'>
          <div className='flex items-center justify-between text-gray-500'>
            <span className='text-xs font-semibold uppercase tracking-wider'>Payment Chase</span>
            <span className='text-lg'>📄</span>
          </div>
          <div>
            <div className='text-2xl sm:text-3xl font-bold text-gray-900'>
              {paymentChaseCount}{" "}
              <span className='text-xs font-normal text-gray-400'>/ {totalClients}</span>
            </div>
            <p className='text-xs text-gray-500 mt-0.5'>Overdue reminders every 3d</p>
          </div>
        </div>

        {/* Card 4: Missing Email Risk */}
        <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3'>
          <div className='flex items-center justify-between text-gray-500'>
            <span className='text-xs font-semibold uppercase tracking-wider'>No Email</span>
            <span className='text-lg'>⚠️</span>
          </div>
          <div>
            <div className='text-2xl sm:text-3xl font-bold text-gray-900'>
              {missingEmailCount}
            </div>
            <p className='text-xs text-gray-500 mt-0.5'>Clients unable to receive emails</p>
          </div>
        </div>
      </div>

      {/* Main Interactive Table & Filter Component */}
      <AutomationsDashboard initialClients={clients} />
    </div>
  );
}
