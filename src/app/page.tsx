import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppointmentActions from "./schedule/AppointmentActions";
import ClientContactActions from "@/components/ClientContactActions";
import UpcomingCleaningsList from "@/components/UpcomingCleaningsList";
import { formatDuration } from "@/lib/date";
import {
  resolveTimezone,
  getZonedDayBounds,
  getZonedWeekBounds,
  getZonedMonthBounds,
  formatInTimezone,
  formatTimeInTimezone,
  getGreetingInTimezone,
  isTomorrowInTimezone,
} from "@/lib/timezone";

export default async function HomePage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
    return null;
  }

  let clientCookieTz: string | undefined;
  try {
    const cookieStore = await cookies();
    clientCookieTz = cookieStore.get("client_timezone")?.value;
  } catch {
    // Graceful fallback when cookies() is called outside of request context (e.g. in tests)
  }

  // 1. Current user details (for greeting, timezone, and home address)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, timezone: true, homeAddress: true },
  });

  const timeZone = resolveTimezone(user?.timezone || clientCookieTz);

  // Time boundary definitions in user's timezone
  const now = new Date();
  const greeting = getGreetingInTimezone(now, timeZone);

  const { startOfDay: startOfToday, endOfDay: endOfToday } = getZonedDayBounds(now, timeZone);
  const { startOfWeek, endOfWeek } = getZonedWeekBounds(now, timeZone);
  const { startOfMonth } = getZonedMonthBounds(now, timeZone);

  // Parallel queries for maximum performance
  const [
    todaysAppointments,
    thisWeekAppointments,
    upcomingAppointments,
    overdueInvoices,
    pendingInvoices,
    monthlyPaidInvoices,
    monthlyCashAppointments,
  ] = await Promise.all([
    // 1. Today's cleanings with full client details (excluding CANCELLED)
    prisma.appointment.findMany({
      where: {
        client: { userId: session.userId },
        date: { gte: startOfToday, lte: endOfToday },
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      include: { client: true },
      orderBy: { date: "asc" },
    }),

    // 2. This week's cleanings for weekly capacity & earnings
    prisma.appointment.findMany({
      where: {
        client: { userId: session.userId },
        date: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      select: { price: true, status: true },
    }),

    // 3. Upcoming scheduled cleanings strictly after today
    prisma.appointment.findMany({
      where: {
        client: { userId: session.userId },
        date: { gt: endOfToday },
        status: "SCHEDULED",
      },
      include: { client: true },
      orderBy: { date: "asc" },
    }),

    // 4. Overdue invoices needing immediate follow-up
    prisma.invoice.findMany({
      where: {
        client: { userId: session.userId },
        status: "OVERDUE",
      },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),

    // 5. Pending invoices
    prisma.invoice.findMany({
      where: {
        client: { userId: session.userId },
        status: "PENDING",
      },
      select: { amount: true },
    }),

    // 6. Invoices paid this month (Bank Transfer)
    prisma.invoice.findMany({
      where: {
        client: { userId: session.userId },
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      select: { amount: true },
    }),

    // 7. Cleanings completed this month with cash payment
    prisma.appointment.findMany({
      where: {
        client: { userId: session.userId },
        status: "COMPLETED",
        paymentMethod: "CASH",
        date: { gte: startOfMonth },
      },
      select: { price: true },
    }),
  ]);

  // Operational & Financial calculations
  const completedTodayCount = (todaysAppointments || []).filter((apt) => apt.status === "COMPLETED").length;
  const scheduledTodayCount = (todaysAppointments || []).filter((apt) => apt.status === "SCHEDULED").length;
  const allJobsCompletedToday = todaysAppointments.length > 0 && scheduledTodayCount === 0;

  const thisWeekEarnings = (thisWeekAppointments || []).reduce((acc, apt) => acc + Number(apt.price), 0);
  const monthlyBankEarnings = (monthlyPaidInvoices || []).reduce((acc, inv) => acc + Number(inv.amount), 0);
  const monthlyCashEarnings = (monthlyCashAppointments || []).reduce((acc, apt) => acc + Number(apt.price), 0);
  const totalMonthEarnings = monthlyBankEarnings + monthlyCashEarnings;
  const totalOverdueAmount = (overdueInvoices || []).reduce((acc, inv) => acc + Number(inv.amount), 0);
  const totalPendingAmount =
    (pendingInvoices || []).reduce((acc, inv) => acc + Number(inv.amount), 0) + totalOverdueAmount;

  const firstName = user?.name ? user.name.split(" ")[0] : "Cleaner";

  const formattedCurrentDate = formatInTimezone(now, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Next job info if today has no jobs
  const nextJob = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  const nextJobDateObj = nextJob ? new Date(nextJob.date) : null;
  const isTomorrow = nextJobDateObj ? isTomorrowInTimezone(now, nextJobDateObj, timeZone) : false;

  const formattedNextJobDate = nextJobDateObj
    ? isTomorrow
      ? `Tomorrow at ${formatTimeInTimezone(nextJobDateObj, timeZone)}`
      : `${formatInTimezone(nextJobDateObj, timeZone, { weekday: "short", day: "numeric", month: "short" })} at ${formatTimeInTimezone(nextJobDateObj, timeZone)}`
    : null;

  return (
    <div className='max-w-5xl mx-auto p-3.5 sm:p-6 lg:p-8 text-gray-900 space-y-6 sm:space-y-8'>
      {/* Top Header & Quick Actions */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>
            {greeting}, {firstName} 👋
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5 capitalize'>{formattedCurrentDate}</p>
        </div>

        {/* Quick Actions (Full touch-targets for mobile thumbs) */}
        <div className='flex items-center gap-2.5 w-full sm:w-auto'>
          <Link
            href='/schedule/new'
            className='flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all min-h-[42px]'>
            <span>＋</span>
            <span>Schedule Cleaning</span>
          </Link>
          <Link
            href='/clients/new'
            className='flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 rounded-xl shadow-xs transition-all min-h-[42px]'>
            <span>＋</span>
            <span>Add Client</span>
          </Link>
        </div>
      </div>

      {/* KPI Highlights: Mobile-First 2x2 Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4'>
        {/* Today's Jobs */}
        <div className='bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all'>
          <span className='text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1'>
            Today&apos;s Jobs
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl sm:text-3xl font-bold text-gray-900'>{todaysAppointments.length}</span>
            <span className='text-xs text-gray-400 font-medium'>cleanings</span>
          </div>
          <p className='text-[11px] text-gray-500 mt-1 truncate'>
            {completedTodayCount > 0
              ? `${completedTodayCount} completed • ${scheduledTodayCount} left`
              : `${scheduledTodayCount} scheduled`}
          </p>
        </div>

        {/* This Week's Volume */}
        <div className='bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all'>
          <span className='text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1'>
            This Week
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl sm:text-3xl font-bold text-blue-600'>${thisWeekEarnings.toFixed(2)}</span>
          </div>
          <p className='text-[11px] text-gray-500 mt-1 truncate'>
            {thisWeekAppointments.length} jobs planned
          </p>
        </div>

        {/* Earned this Month */}
        <div className='bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all'>
          <span className='text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1'>
            Earned this Month
          </span>
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl sm:text-3xl font-bold text-emerald-600'>
              ${totalMonthEarnings.toFixed(2)}
            </span>
          </div>
          <p className='text-[11px] text-gray-500 mt-1 truncate'>
            {monthlyCashEarnings > 0
              ? `$${monthlyBankEarnings.toFixed(0)} bank • $${monthlyCashEarnings.toFixed(0)} cash`
              : `${monthlyPaidInvoices.length} paid invoices`}
          </p>
        </div>

        {/* Overdue / Pending Invoices */}
        <Link href='/invoices' className='block group'>
          <div
            className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-xs transition-all group-hover:border-gray-300 ${
              overdueInvoices.length > 0 ? "border-red-200/90 bg-red-50/20" : "border-gray-200"
            }`}>
            <span className='text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1'>
              Outstanding
            </span>
            <div className='flex items-baseline gap-1.5'>
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  overdueInvoices.length > 0 ? "text-red-600" : "text-amber-600"
                }`}>
                ${totalPendingAmount.toFixed(2)}
              </span>
            </div>
            <p
              className={`text-[11px] font-semibold mt-1 truncate ${
                overdueInvoices.length > 0 ? "text-red-600" : "text-gray-500"
              }`}>
              {overdueInvoices.length > 0
                ? `⚠️ ${overdueInvoices.length} overdue`
                : "All on track"}
            </p>
          </div>
        </Link>
      </div>

      {/* HERO SECTION: Today's Agenda (Sua Rota de Hoje) */}
      <div className='space-y-3.5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-lg'>📍</span>
            <h2 className='text-lg sm:text-xl font-bold text-gray-900 tracking-tight'>
              Today&apos;s Agenda
            </h2>
            <span className='text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100'>
              {todaysAppointments.length} {todaysAppointments.length === 1 ? "job" : "jobs"}
            </span>
          </div>
          <Link
            href='/schedule?tab=upcoming'
            className='text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline'>
            Full Schedule →
          </Link>
        </div>

        {/* TIME TO HEAD HOME CARD */}
        {allJobsCompletedToday && (
          <div
            data-testid='time-to-go-home-card'
            className='bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300'>
            <div className='space-y-1.5'>
              <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-semibold'>
                <span>🎉</span>
                <span>All cleanings completed!</span>
              </div>
              <h3 className='text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2'>
                <span>Time to head home!</span>
                <span className='text-sm sm:text-base font-normal text-emerald-100'>🏠</span>
              </h3>
              <p className='text-xs sm:text-sm text-emerald-50 max-w-xl leading-relaxed'>
                {user?.homeAddress ? (
                  <>
                    You&apos;ve completed all <strong>{todaysAppointments.length}</strong> cleanings scheduled for today. Great work, rest up and have a safe trip home!
                  </>
                ) : (
                  <>
                    You&apos;ve completed all cleanings scheduled for today! Add your residential address in Settings to get 1-tap directions home.
                  </>
                )}
              </p>
              {user?.homeAddress && (
                <div className='inline-flex items-center gap-1.5 text-xs text-emerald-100/90 font-medium bg-black/15 px-3 py-1 rounded-lg mt-1 max-w-full'>
                  <span className='shrink-0'>📍</span>
                  <span className='truncate'>{user.homeAddress}</span>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2.5 shrink-0 pt-1 md:pt-0'>
              {user?.homeAddress ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(user.homeAddress)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-950 bg-white hover:bg-emerald-50 active:bg-emerald-100 rounded-xl shadow-md hover:shadow-lg transition-all'>
                  <span>🚗</span>
                  <span>Navigate Home (Google Maps)</span>
                  <svg className='w-4 h-4 text-emerald-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M14 5l7 7m0 0l-7 7m7-7H3' />
                  </svg>
                </a>
              ) : (
                <Link
                  href='/settings'
                  className='w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-xl shadow-md transition-all'>
                  <span>🏠</span>
                  <span>Set Home Address</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {todaysAppointments.length === 0 ? (
          /* Empty State for Today: Positive, informative */
          <div className='bg-white border border-dashed border-gray-200 rounded-3xl p-6 sm:p-10 text-center space-y-3'>
            <span className='text-3xl sm:text-4xl block'>☕</span>
            <h3 className='text-base font-bold text-gray-900'>No cleanings scheduled for today</h3>
            <p className='text-xs sm:text-sm text-gray-500 max-w-md mx-auto'>
              {nextJob
                ? `Your next appointment is ${formattedNextJobDate} with ${nextJob.client.name}. Enjoy your time or plan ahead!`
                : "No appointments coming up. Add a new cleaning to keep your calendar filled."}
            </p>
            <div className='pt-2'>
              <Link
                href='/schedule/new'
                className='inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors'>
                <span>＋</span>
                <span>Schedule an Appointment</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Today's Jobs List: Rich, actionable cards designed for mobile */
          <div className='space-y-3.5'>
            {todaysAppointments.map((apt) => {
              const formattedTime = formatTimeInTimezone(apt.date, timeZone);
              const isCompleted = apt.status === "COMPLETED";

              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                apt.client.address,
              )}`;

              return (
                <div
                  key={apt.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3.5 ${
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50/15"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}>
                  {/* Top Bar: Time, Status, and Price */}
                  <div className='flex items-center justify-between gap-2 flex-wrap'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-bold text-sm text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg'>
                        ⏰ {formattedTime}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          apt.status === "SCHEDULED"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                        {apt.status}
                      </span>
                      {isCompleted && apt.paymentMethod && (
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            apt.paymentMethod === "CASH"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                          {apt.paymentMethod === "CASH" ? "💵 Cash" : "🏦 Bank"}
                        </span>
                      )}
                      {apt.durationMinutes ? (
                        <span className='text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200'>
                          ⏱️ {formatDuration(apt.durationMinutes)}
                        </span>
                      ) : null}
                    </div>

                    <span className='text-base sm:text-lg font-bold text-gray-900'>
                      ${Number(apt.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Client & Address Info */}
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between gap-2'>
                      <Link
                        href={`/clients/${apt.client.id}`}
                        className='text-base font-bold text-gray-900 hover:text-blue-600 hover:underline truncate'>
                        {apt.client.name}
                      </Link>
                    </div>

                    {apt.client.address && (
                      <div className='flex items-center gap-2 text-xs text-gray-600 flex-wrap'>
                        <span className='truncate max-w-xs sm:max-w-md'>📍 {apt.client.address}</span>
                        <a
                          href={mapsUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded-md text-[11px] transition-colors shrink-0'>
                          <span>Open Maps</span>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Client Notes / Instructions: High utility for cleaners on site */}
                  {apt.client.notes && apt.client.notes.trim() !== "" && (
                    <div className='p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5'>
                      <span className='text-base shrink-0 mt-0.5'>📝</span>
                      <div className='min-w-0 flex-1'>
                        <span className='font-bold uppercase tracking-wider text-[10px] text-amber-800 block'>
                          Client Instructions / Notes
                        </span>
                        <p className='text-amber-950 font-medium whitespace-pre-line mt-0.5 leading-relaxed'>
                          {apt.client.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Options: Mobile-First Call / SMS / WhatsApp */}
                  {apt.client.phone && (
                    <div className='pt-1 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                      <span className='text-xs text-gray-500 font-medium'>
                        Contact ({apt.client.phone}):
                      </span>
                      <ClientContactActions phone={apt.client.phone} clientName={apt.client.name} />
                    </div>
                  )}

                  {/* Action Bar: Complete / Edit / Cancel */}
                  <div className='pt-2 border-t border-gray-100 flex items-center justify-end gap-2'>
                    <AppointmentActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      clientName={apt.client.name}
                      initialDate={apt.date}
                      initialPrice={Number(apt.price)}
                      clientPreferredPaymentMethod={apt.client.preferredPaymentMethod}
                      clientHourlyRate={apt.client.hourlyRate ? Number(apt.client.hourlyRate) : 50}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secondary Sections: 2 Columns on Desktop, Stacked on Mobile */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2'>
        {/* Left: Upcoming Cleanings (Next days) */}
        <div className='lg:col-span-2 space-y-3.5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-base'>🗓️</span>
              <h2 className='text-base font-bold text-gray-900'>Upcoming Cleanings</h2>
            </div>
            <Link
              href='/schedule'
              className='text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline'>
              View All →
            </Link>
          </div>

          <UpcomingCleaningsList
            appointments={upcomingAppointments.map((apt) => ({
              id: apt.id,
              date: typeof apt.date === "string" ? apt.date : apt.date.toISOString(),
              price: Number(apt.price),
              client: {
                id: apt.client.id,
                name: apt.client.name,
                phone: apt.client.phone,
                address: apt.client.address,
              },
            }))}
            timeZone={timeZone}
            pageSize={6}
          />
        </div>

        {/* Right: Financial & Collection Priorities */}
        <div className='space-y-3.5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <span className='text-base'>💳</span>
              <h2 className='text-base font-bold text-gray-900'>Billing & Cash Flow</h2>
            </div>
            <Link
              href='/invoices'
              className='text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline'>
              Invoices →
            </Link>
          </div>

          <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4'>
            {/* Overdue Section: Priority Action Items */}
            {overdueInvoices.length > 0 ? (
              <div className='space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1'>
                    <span>⚠️</span>
                    <span>Action Required ({overdueInvoices.length})</span>
                  </span>
                  <span className='text-xs font-bold text-red-600'>
                    ${totalOverdueAmount.toFixed(2)}
                  </span>
                </div>

                <div className='space-y-2'>
                  {overdueInvoices.map((inv) => {
                    const daysOverdue = Math.max(
                      1,
                      Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
                    );

                    return (
                      <div
                        key={inv.id}
                        className='p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-2'>
                        <div className='flex items-start justify-between gap-2'>
                          <div>
                            <Link
                              href={`/clients/${inv.client.id}`}
                              className='font-bold text-xs text-gray-900 hover:text-red-700 hover:underline'>
                              {inv.client.name}
                            </Link>
                            <p className='text-[10px] text-red-600 font-semibold mt-0.5'>
                              {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
                            </p>
                          </div>
                          <span className='text-xs font-bold text-red-700'>
                            ${Number(inv.amount).toFixed(2)}
                          </span>
                        </div>

                        {/* Quick Chase Contact (Call / SMS / WhatsApp) */}
                        <div className='flex items-center justify-between pt-1.5 border-t border-red-100'>
                          <span className='text-[10px] font-medium text-gray-500'>Chase payment:</span>
                          <ClientContactActions
                            phone={inv.client.phone}
                            clientName={inv.client.name}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className='p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium'>
                <span className='text-emerald-600 text-sm'>✓</span>
                <span>All invoices are currently up to date!</span>
              </div>
            )}

            {/* Monthly Summary Breakdown */}
            <div className='border-t border-gray-100 pt-3 space-y-2.5'>
              <div className='flex justify-between text-xs py-0.5 text-gray-600'>
                <span>Total Outstanding</span>
                <span className='font-semibold text-gray-900'>${totalPendingAmount.toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-xs py-0.5 text-gray-600'>
                <span>Collected this Month</span>
                <span className='font-bold text-emerald-600'>${totalMonthEarnings.toFixed(2)}</span>
              </div>

              {/* Compact Bank vs Cash Breakdown */}
              <div className='grid grid-cols-2 gap-2 pt-1'>
                <div className='bg-blue-50/70 border border-blue-100/80 rounded-xl p-2.5'>
                  <span className='text-[10px] font-bold text-blue-700 uppercase tracking-wider block'>🏦 Bank Transfer</span>
                  <span className='text-sm font-bold text-blue-900'>${monthlyBankEarnings.toFixed(2)}</span>
                  <span className='text-[10px] text-blue-600/80 block mt-0.5'>{monthlyPaidInvoices.length} paid</span>
                </div>
                <div className='bg-amber-50/70 border border-amber-100/80 rounded-xl p-2.5'>
                  <span className='text-[10px] font-bold text-amber-700 uppercase tracking-wider block'>💵 Cash Collected</span>
                  <span className='text-sm font-bold text-amber-900'>${monthlyCashEarnings.toFixed(2)}</span>
                  <span className='text-[10px] text-amber-600/80 block mt-0.5'>{monthlyCashAppointments.length} cleanings</span>
                </div>
              </div>
            </div>

            <Link
              href='/invoices'
              className='block w-full text-center py-2.5 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors min-h-[40px] flex items-center justify-center'>
              Manage Invoices & Payments →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
