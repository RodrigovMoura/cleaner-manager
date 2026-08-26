import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/actions/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const appointments = client.appointments || [];

  return (
    <div className='max-w-5xl mx-auto p-6 text-gray-900'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{client.name}</h1>
          <p className='text-sm text-gray-500 mt-1'>Client Dashboard & History</p>
        </div>
        <div className='flex gap-3'>
          <Link
            href='/clients'
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
            Back to Clients
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm'>
            Edit Client
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Client Info & Preferences */}
        <div className='space-y-6'>
          {/* Contact Info */}
          <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm'>
            <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Contact Information</h2>
            <div className='space-y-3 text-sm'>
              <div>
                <span className='block text-gray-500 text-xs mb-0.5'>Email</span>
                <span className='font-medium'>{client.email || "Not provided"}</span>
              </div>
              <div>
                <span className='block text-gray-500 text-xs mb-0.5'>Phone</span>
                <span className='font-medium'>{client.phone || "Not provided"}</span>
              </div>
              <div>
                <span className='block text-gray-500 text-xs mb-0.5'>Address</span>
                <span className='font-medium'>{client.address || "Not provided"}</span>
              </div>
            </div>
          </div>

          {/* Automation Toggles Summary */}
          <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm'>
            <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4'>Automation Rules</h2>
            <ul className='space-y-4 text-sm'>
              <li className='flex items-center justify-between'>
                <span className='text-gray-600 font-medium'>Appointment Reminder</span>
                {client.enableAppointmentReminder ? (
                  <span className='px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100'>
                    Active ({client.reminderDaysBefore}d)
                  </span>
                ) : (
                  <span className='px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'>
                    Disabled
                  </span>
                )}
              </li>
              <li className='flex items-center justify-between'>
                <span className='text-gray-600 font-medium'>Invoice Generation</span>
                {client.enableInvoice ? (
                  <span className='px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100'>
                    {client.autoSendInvoice ? "Auto Send" : "Manual Review"}
                  </span>
                ) : (
                  <span className='px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'>
                    Disabled
                  </span>
                )}
              </li>
              <li className='flex items-center justify-between'>
                <span className='text-gray-600 font-medium'>Payment Reminders</span>
                {client.enablePaymentReminder ? (
                  <span className='px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100'>
                    Active
                  </span>
                ) : (
                  <span className='px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'>
                    Disabled
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Appointments & Invoices */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Cleaning Schedule */}
          <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm'>
            <div className='flex items-center justify-between mb-4 gap-2 flex-wrap'>
              <h2 className='text-base font-semibold text-gray-900'>Cleaning Schedule</h2>
              <div className='flex items-center gap-2'>
                <Link
                  href='/schedule'
                  className='text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors'>
                  View Schedule
                </Link>
                <Link
                  href='/schedule/new'
                  className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors'>
                  + Schedule Cleaning
                </Link>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className='bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center min-h-[160px] flex flex-col items-center justify-center'>
                <p className='text-sm text-gray-600 font-medium mb-1'>No cleanings scheduled for this client.</p>
                <p className='text-xs text-gray-400'>Use the button above to add an appointment.</p>
              </div>
            ) : (
              <div className='max-h-72 overflow-y-auto pr-1 space-y-2.5'>
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

                  return (
                    <div
                      key={apt.id}
                      className='border border-gray-100 bg-gray-50/60 p-3.5 rounded-xl flex items-center justify-between gap-4 text-sm'>
                      <div className='space-y-0.5'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-gray-900'>{formattedDate}</span>
                          <span className='text-xs text-gray-500'>at {formattedTime}</span>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <span className='text-xs font-semibold text-gray-700'>${Number(apt.price).toFixed(2)}</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : apt.status === "CANCELLED"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoices Placeholder */}
          <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-semibold text-gray-900'>Invoices & Billing</h2>
              <button
                className='text-xs font-semibold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed'
                disabled>
                Create Invoice
              </button>
            </div>
            <div className='bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center min-h-[160px] flex flex-col items-center justify-center'>
              <p className='text-sm text-gray-600 font-medium mb-1'>No invoices generated yet.</p>
              <p className='text-xs text-gray-400'>The billing module will be implemented in Step 4.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
