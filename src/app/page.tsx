import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  // Definição dos limites de tempo (Hoje e Início do Mês)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Consultas em paralelo para máxima performance
  const [clientsCount, todaysAppointments, upcomingAppointments, pendingInvoices, monthlyPaidInvoices] =
    await Promise.all([
      // 1. Total de clientes
      prisma.client.count({
        where: { userId: session.userId },
      }),

      // 2. Limpezas de hoje
      prisma.appointment.findMany({
        where: {
          client: { userId: session.userId },
          date: { gte: startOfToday, lte: endOfToday },
        },
        include: { client: true },
        orderBy: { date: "asc" },
      }),

      // 3. Próximas limpezas agendadas (a partir de hoje)
      prisma.appointment.findMany({
        where: {
          client: { userId: session.userId },
          date: { gte: startOfToday },
          status: "SCHEDULED",
        },
        include: { client: true },
        orderBy: { date: "asc" },
        take: 4,
      }),

      // 4. Invoices pendentes ou atrasadas
      prisma.invoice.findMany({
        where: {
          client: { userId: session.userId },
          status: { in: ["PENDING", "OVERDUE"] },
        },
        select: { amount: true, status: true },
      }),

      // 5. Invoices pagas neste mês
      prisma.invoice.findMany({
        where: {
          client: { userId: session.userId },
          status: "PAID",
          paidAt: { gte: startOfMonth },
        },
        select: { amount: true },
      }),
    ]);

  // Cálculos financeiros
  const totalPendingAmount = pendingInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);
  const totalMonthEarnings = monthlyPaidInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);

  const formattedCurrentDate = now.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 text-gray-900 space-y-6'>
      {/* Top Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>{formattedCurrentDate}</p>
        </div>

        {/* Quick Action Buttons */}
        <div className='flex items-center gap-2 flex-wrap'>
          <Link
            href='/schedule/new'
            className='flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors'>
            + Schedule Cleaning
          </Link>
          <Link
            href='/clients/new'
            className='flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-sm transition-colors'>
            + Add Client
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {/* Today's Cleanings */}
        <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Today&apos;s Jobs
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold text-gray-900'>{todaysAppointments.length}</span>
            <span className='text-xs text-gray-400'>cleanings</span>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Pending Invoices
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold text-amber-600'>${totalPendingAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Monthly Earnings */}
        <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Earned this Month
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold text-emerald-600'>${totalMonthEarnings.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Clients */}
        <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Active Clients
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl font-bold text-blue-600'>{clientsCount}</span>
            <span className='text-xs text-gray-400'>total</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub (Touch-friendly on mobile) */}
      <div className='grid grid-cols-3 gap-2 sm:gap-4'>
        <Link
          href='/schedule'
          className='p-3 sm:p-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl shadow-sm text-center transition-all group'>
          <span className='block text-lg sm:text-xl mb-1 group-hover:scale-110 transition-transform'>📅</span>
          <span className='text-xs sm:text-sm font-semibold text-gray-800'>Schedule</span>
        </Link>

        <Link
          href='/clients'
          className='p-3 sm:p-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl shadow-sm text-center transition-all group'>
          <span className='block text-lg sm:text-xl mb-1 group-hover:scale-110 transition-transform'>👥</span>
          <span className='text-xs sm:text-sm font-semibold text-gray-800'>Clients</span>
        </Link>

        <Link
          href='/invoices'
          className='p-3 sm:p-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl shadow-sm text-center transition-all group'>
          <span className='block text-lg sm:text-xl mb-1 group-hover:scale-110 transition-transform'>📄</span>
          <span className='text-xs sm:text-sm font-semibold text-gray-800'>Invoices</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Upcoming Cleanings (Takes 2 cols on desktop) */}
        <div className='lg:col-span-2 space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-bold text-gray-900'>Upcoming Cleanings</h2>
            <Link href='/schedule' className='text-xs font-semibold text-blue-600 hover:underline'>
              View All
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className='bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center'>
              <p className='text-sm font-medium text-gray-600 mb-1'>No upcoming cleanings</p>
              <p className='text-xs text-gray-400 mb-3'>Schedule your next appointments to see them here.</p>
              <Link href='/schedule/new' className='inline-block text-xs font-semibold text-blue-600 hover:underline'>
                + Schedule Now
              </Link>
            </div>
          ) : (
            <div className='space-y-2.5'>
              {upcomingAppointments.map((apt) => {
                const dateObj = new Date(apt.date);
                const formattedDate = dateObj.toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={apt.id}
                    className='p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between gap-3 hover:border-gray-300 transition-colors'>
                    <div className='space-y-0.5'>
                      <div className='flex items-center gap-2'>
                        <Link
                          href={`/clients/${apt.client.id}`}
                          className='font-semibold text-sm text-gray-900 hover:underline'>
                          {apt.client.name}
                        </Link>
                        <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700'>
                          {formattedTime}
                        </span>
                      </div>
                      <p className='text-xs text-gray-500'>
                        {formattedDate} {apt.client.address && `• ${apt.client.address}`}
                      </p>
                    </div>

                    <span className='text-sm font-bold text-gray-900'>${Number(apt.price).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pending Invoices Summary */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-bold text-gray-900'>Pending Payments</h2>
            <Link href='/invoices' className='text-xs font-semibold text-blue-600 hover:underline'>
              View Invoices
            </Link>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4'>
            <div>
              <span className='text-xs text-gray-500 block'>Total Unpaid Balance</span>
              <span className='text-2xl font-bold text-gray-900'>${totalPendingAmount.toFixed(2)}</span>
            </div>

            <div className='border-t border-gray-100 pt-3'>
              <div className='flex justify-between text-xs py-1 text-gray-600'>
                <span>Pending Invoices</span>
                <span className='font-semibold'>{pendingInvoices.filter((i) => i.status === "PENDING").length}</span>
              </div>
              <div className='flex justify-between text-xs py-1 text-gray-600'>
                <span>Overdue Invoices</span>
                <span className='font-semibold text-red-600'>
                  {pendingInvoices.filter((i) => i.status === "OVERDUE").length}
                </span>
              </div>
            </div>

            <Link
              href='/invoices'
              className='block w-full text-center py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors'>
              Manage Payments & Invoices →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
