import Link from "next/link";
import { getAppointments } from "@/actions/appointment";
import AppointmentActions from "./AppointmentActions";

export default async function SchedulePage() {
  const appointments = await getAppointments();

  const scheduledAppointments = appointments.filter((a) => a.status === "SCHEDULED");
  const pastAppointments = appointments.filter((a) => a.status !== "SCHEDULED");

  return (
    <div className='max-w-4xl mx-auto p-6 text-gray-900 space-y-8'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Schedule</h1>
          <p className='text-sm text-gray-500 mt-0.5'>Manage upcoming cleanings and appointments.</p>
        </div>
        <Link
          href='/schedule/new'
          className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm'>
          + Schedule Cleaning
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-8 text-center'>
          <p className='text-gray-600 font-medium mb-1'>No appointments scheduled</p>
          <p className='text-sm text-gray-400 mb-4'>Create your first appointment to populate your agenda.</p>
          <Link
            href='/schedule/new'
            className='inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors'>
            Schedule Cleaning
          </Link>
        </div>
      ) : (
        <div className='space-y-8'>
          {/* Upcoming Section */}
          <div>
            <h2 className='text-base font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              Upcoming Cleanings
              <span className='text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full'>
                {scheduledAppointments.length}
              </span>
            </h2>

            {scheduledAppointments.length === 0 ? (
              <p className='text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl'>
                No active upcoming cleanings.
              </p>
            ) : (
              <div className='space-y-3'>
                {scheduledAppointments.map((apt) => {
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

                  return (
                    <div
                      key={apt.id}
                      className='border border-gray-200 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <Link
                            href={`/clients/${apt.client.id}`}
                            className='font-semibold text-gray-900 hover:underline'>
                            {apt.client.name}
                          </Link>
                          <span className='text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100'>
                            SCHEDULED
                          </span>
                        </div>
                        <p className='text-xs text-gray-500'>
                          {formattedDate} at {formattedTime}
                        </p>
                        {apt.client.address && <p className='text-xs text-gray-400'>{apt.client.address}</p>}
                      </div>

                      <div className='flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                        <span className='text-sm font-bold text-gray-900'>${Number(apt.price).toFixed(2)}</span>
                        <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past / Completed Section */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className='text-base font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                History
                <span className='text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full'>
                  {pastAppointments.length}
                </span>
              </h2>

              <div className='space-y-3'>
                {pastAppointments.map((apt) => {
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

                  return (
                    <div
                      key={apt.id}
                      className='border border-gray-200 p-4 rounded-xl bg-gray-50/70 opacity-90 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <Link
                            href={`/clients/${apt.client.id}`}
                            className='font-medium text-gray-800 hover:underline'>
                            {apt.client.name}
                          </Link>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              apt.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className='text-xs text-gray-500'>
                          {formattedDate} at {formattedTime}
                        </p>
                      </div>

                      <div className='flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200'>
                        <span className='text-sm font-medium text-gray-600'>${Number(apt.price).toFixed(2)}</span>
                        <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
