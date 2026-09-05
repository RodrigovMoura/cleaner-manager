import Link from "next/link";
import { getAppointments } from "@/actions/appointment";
import AppointmentActions from "./AppointmentActions";

interface SchedulePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab === "history" ? "history" : "upcoming";
  const isHistory = currentTab === "history";

  const appointments = await getAppointments(currentTab);

  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Schedule</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>
            Manage upcoming cleanings and review completed history.
          </p>
        </div>
        <Link
          href='/schedule/new'
          className='inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs self-start sm:self-auto'>
          <span>＋</span>
          <span>Schedule Cleaning</span>
        </Link>
      </div>

      {/* Tabs Switcher */}
      <div className='flex border-b border-gray-200'>
        <Link
          href='/schedule?tab=upcoming'
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            !isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          Upcoming Cleanings
        </Link>
        <Link
          href='/schedule?tab=history'
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          History & Past Jobs
        </Link>
      </div>

      {/* Content Area */}
      {appointments.length === 0 ? (
        <div className='bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center'>
          <span className='text-3xl block mb-2'>{isHistory ? "📁" : "📅"}</span>
          <p className='text-gray-800 font-semibold text-sm sm:text-base mb-1'>
            {isHistory ? "No past appointments found" : "No upcoming cleanings scheduled"}
          </p>
          <p className='text-xs sm:text-sm text-gray-400 mb-5 max-w-sm mx-auto'>
            {isHistory
              ? "Completed and cancelled cleanings will appear here."
              : "Create an appointment to start organizing your calendar."}
          </p>
          {!isHistory && (
            <Link
              href='/schedule/new'
              className='inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs'>
              <span>＋</span>
              <span>Schedule Cleaning</span>
            </Link>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {appointments.map((apt) => {
            const dateObj = new Date(apt.date);
            const formattedDate = dateObj.toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const formattedTime = dateObj.toLocaleTimeString("en-AU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const isCompleted = apt.status === "COMPLETED";

            return (
              <div
                key={apt.id}
                className={`border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isHistory
                    ? "bg-white/80 border-gray-200 opacity-90"
                    : "bg-white border-gray-200 shadow-xs hover:shadow-sm hover:border-gray-300"
                }`}>
                <div className='space-y-1.5 min-w-0 flex-1'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Link
                      href={`/clients/${apt.client.id}`}
                      className='font-bold text-sm sm:text-base text-gray-900 hover:text-blue-600 hover:underline truncate'>
                      {apt.client.name}
                    </Link>
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
                  </div>

                  <p className='text-xs text-gray-500'>
                    {formattedDate} at <strong className='text-gray-700 font-semibold'>{formattedTime}</strong>
                  </p>

                  {apt.client.address && <p className='text-xs text-gray-400 truncate'>{apt.client.address}</p>}
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                  <span
                    className={`text-base font-bold ${isHistory ? "text-gray-600 font-medium" : "text-gray-900"}`}>
                    ${Number(apt.price).toFixed(2)}
                  </span>
                  <AppointmentActions
                    appointmentId={apt.id}
                    currentStatus={apt.status}
                    clientName={apt.client.name}
                    initialDate={apt.date}
                    initialPrice={Number(apt.price)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
