import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/actions/client";
import AppointmentActions from "@/app/schedule/AppointmentActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  // Priority: 1. SCHEDULED (asc) -> 2. COMPLETED (desc) -> 3. CANCELLED (desc)
  const statusPriority: Record<string, number> = {
    SCHEDULED: 1,
    COMPLETED: 2,
    CANCELLED: 3,
  };

  const appointments = [...(client.appointments || [])].sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 99;
    const priorityB = statusPriority[b.status] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();

    return a.status === "SCHEDULED" ? timeA - timeB : timeB - timeA;
  });

  const invoices = client.invoices || [];

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>{client.name}</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Client Dashboard & History</p>
        </div>
        <div className='flex items-center gap-2.5 flex-wrap sm:flex-nowrap'>
          <Link
            href='/clients'
            className='px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs'>
            ← Back to Clients
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className='px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs'>
            Edit Client
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Client Info & Preferences */}
        <div className='space-y-6'>
          {/* Contact Info */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Contact Information</h2>
            <div className='space-y-3 text-sm divide-y divide-gray-100'>
              <div className='pt-1 first:pt-0'>
                <span className='block text-gray-400 text-xs mb-0.5'>Email</span>
                <span className='font-medium text-gray-900 break-all'>{client.email || "Not provided"}</span>
              </div>
              <div className='pt-2.5'>
                <span className='block text-gray-400 text-xs mb-0.5'>Phone</span>
                <span className='font-medium text-gray-900'>{client.phone || "Not provided"}</span>
              </div>
              <div className='pt-2.5'>
                <span className='block text-gray-400 text-xs mb-0.5'>Property Address</span>
                <span className='font-medium text-gray-900 leading-relaxed'>{client.address || "Not provided"}</span>
              </div>
            </div>
          </div>

          {/* Automation Toggles Summary */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Automation Rules</h2>
            <ul className='space-y-3.5 text-sm'>
              <li className='flex items-center justify-between gap-2'>
                <span className='text-gray-700 font-medium text-xs sm:text-sm'>Appointment Reminder</span>
                {client.enableAppointmentReminder ? (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100'>
                    Active ({client.reminderDaysBefore}d)
                  </span>
                ) : (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
                    Disabled
                  </span>
                )}
              </li>
              <li className='flex items-center justify-between gap-2'>
                <span className='text-gray-700 font-medium text-xs sm:text-sm'>Invoice Generation</span>
                {client.enableInvoice ? (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100'>
                    {client.autoSendInvoice ? "Auto Send" : "Manual Review"}
                  </span>
                ) : (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
                    Disabled
                  </span>
                )}
              </li>
              <li className='flex items-center justify-between gap-2'>
                <span className='text-gray-700 font-medium text-xs sm:text-sm'>Payment Alerts</span>
                {client.enablePaymentReminder ? (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100'>
                    Active
                  </span>
                ) : (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500'>
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
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='flex items-center justify-between gap-2 flex-wrap'>
              <h2 className='text-base font-bold text-gray-900'>Cleaning Schedule</h2>
              <div className='flex items-center gap-2'>
                <Link
                  href='/schedule'
                  className='text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors'>
                  View Schedule
                </Link>
                <Link
                  href={`/schedule/new?clientId=${client.id}`}
                  className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors'>
                  ＋ Schedule Cleaning
                </Link>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className='bg-gray-50/60 border border-dashed border-gray-200 rounded-xl p-8 text-center min-h-36 flex flex-col items-center justify-center'>
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
                      className='border border-gray-100 bg-gray-50/70 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm'>
                      <div className='space-y-0.5 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='font-semibold text-gray-900'>{formattedDate}</span>
                          <span className='text-xs text-gray-500 font-medium'>at {formattedTime}</span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between sm:justify-end gap-3 flex-wrap sm:flex-nowrap shrink-0'>
                        <span className='text-xs font-bold text-gray-900'>${Number(apt.price).toFixed(2)}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            apt.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : apt.status === "CANCELLED"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                          {apt.status}
                        </span>
                        <AppointmentActions
                          appointmentId={apt.id}
                          currentStatus={apt.status}
                          clientName={client.name}
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

          {/* Invoices & Billing */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='flex items-center justify-between gap-2 flex-wrap'>
              <h2 className='text-base font-bold text-gray-900'>Invoices & Billing</h2>
              <Link
                href='/invoices'
                className='text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors'>
                View Invoices
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className='bg-gray-50/60 border border-dashed border-gray-200 rounded-xl p-8 text-center min-h-36 flex flex-col items-center justify-center'>
                <p className='text-sm text-gray-600 font-medium mb-1'>No invoices generated for this client.</p>
                <p className='text-xs text-gray-400'>
                  Invoices are created automatically when appointments are completed.
                </p>
              </div>
            ) : (
              <div className='max-h-72 overflow-y-auto pr-1 space-y-2.5'>
                {invoices.map((inv) => {
                  const dueDateObj = new Date(inv.dueDate);
                  const formattedDueDate = dueDateObj.toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={inv.id}
                      className='border border-gray-100 bg-gray-50/70 p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm'>
                      <div className='space-y-0.5 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='font-mono text-xs font-bold text-gray-700 bg-gray-200/80 px-1.5 py-0.5 rounded'>
                            {inv.invoiceNumber}
                          </span>
                          <span className='text-xs text-gray-500'>Due {formattedDueDate}</span>
                        </div>
                      </div>

                      <div className='flex items-center gap-2.5 shrink-0'>
                        <span className='text-xs font-bold text-gray-900'>${Number(inv.amount).toFixed(2)}</span>
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-xs font-semibold text-blue-600 hover:underline'>
                          PDF
                        </a>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : inv.status === "OVERDUE"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
