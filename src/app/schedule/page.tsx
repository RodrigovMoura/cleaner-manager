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
    <div className='max-w-4xl mx-auto p-6 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Schedule</h1>
          <p className='text-sm text-gray-500 mt-0.5'>Manage upcoming cleanings and review completed history.</p>
        </div>
        <Link
          href='/schedule/new'
          className='inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm self-start sm:self-auto'>
          + Schedule Cleaning
        </Link>
      </div>

      {/* Tabs Switcher */}
      <div className='flex border-b border-gray-200'>
        <Link
          href='/schedule?tab=upcoming'
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            !isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          Upcoming Cleanings
        </Link>
        <Link
          href='/schedule?tab=history'
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          History & Past Jobs
        </Link>
      </div>

      {/* Content Area */}
      {appointments.length === 0 ? (
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-8 text-center'>
          <p className='text-gray-700 font-medium mb-1'>
            {isHistory ? "No past appointments found" : "No upcoming cleanings scheduled"}
          </p>
          <p className='text-sm text-gray-400 mb-4'>
            {isHistory
              ? "Completed and cancelled cleanings will appear here."
              : "Create an appointment to start organizing your schedule."}
          </p>
          {!isHistory && (
            <Link
              href='/schedule/new'
              className='inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm'>
              Schedule Cleaning
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
                className={`border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-shadow ${
                  isHistory
                    ? "bg-gray-50/70 border-gray-200 opacity-90"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                }`}>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <Link href={`/clients/${apt.client.id}`} className='font-semibold text-gray-900 hover:underline'>
                      {apt.client.name}
                    </Link>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
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
                    {formattedDate} at {formattedTime}
                  </p>
                  {apt.client.address && <p className='text-xs text-gray-400'>{apt.client.address}</p>}
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                  <span className={`text-sm font-bold ${isHistory ? "text-gray-600 font-medium" : "text-gray-900"}`}>
                    ${Number(apt.price).toFixed(2)}
                  </span>
                  <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
