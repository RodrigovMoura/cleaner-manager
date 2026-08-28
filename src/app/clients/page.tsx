import Link from "next/link";
import { getClients } from "@/actions/client";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Clients</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>Manage your clients and automation rules.</p>
        </div>
        <Link
          href='/clients/new'
          className='inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs self-start sm:self-auto'>
          <span>＋</span>
          <span>New Client</span>
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className='bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center'>
          <span className='text-3xl block mb-2'>👥</span>
          <p className='text-gray-800 font-semibold text-sm sm:text-base mb-1'>No clients found</p>
          <p className='text-xs sm:text-sm text-gray-400 mb-5 max-w-sm mx-auto'>
            Add your first client to configure automatic reminders and seamless billing.
          </p>
          <Link
            href='/clients/new'
            className='inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs'>
            <span>＋</span>
            <span>Add Client</span>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
          {clients.map((client) => (
            <div
              key={client.id}
              className='border border-gray-200 p-5 sm:p-6 rounded-2xl bg-white shadow-xs hover:shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between gap-4'>
              <div className='space-y-2'>
                <div className='flex items-start justify-between gap-2'>
                  <Link
                    href={`/clients/${client.id}`}
                    className='group flex items-center gap-1.5 hover:underline decoration-blue-500 underline-offset-2'>
                    <h2 className='text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors'>
                      {client.name}
                    </h2>
                  </Link>
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className='text-xs font-semibold text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50/50 transition-colors shrink-0'>
                    Edit
                  </Link>
                </div>

                <div className='space-y-1 text-xs text-gray-500'>
                  {client.address && (
                    <p className='flex items-center gap-1.5 truncate'>
                      <span className='text-gray-400'>📍</span>
                      <span className='truncate'>{client.address}</span>
                    </p>
                  )}
                  {client.email && (
                    <p className='flex items-center gap-1.5 truncate'>
                      <span className='text-gray-400'>✉️</span>
                      <span className='truncate'>{client.email}</span>
                    </p>
                  )}
                  {client.phone && (
                    <p className='flex items-center gap-1.5 truncate'>
                      <span className='text-gray-400'>📞</span>
                      <span>{client.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Automation Badges */}
              <div className='flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 text-[11px] font-semibold'>
                {client.enableAppointmentReminder && (
                  <span className='bg-blue-50 text-blue-700 border border-blue-100/80 px-2 py-0.5 rounded-md'>
                    Reminder ({client.reminderDaysBefore}d)
                  </span>
                )}
                {client.enableInvoice && (
                  <span className='bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2 py-0.5 rounded-md'>
                    Invoice {client.autoSendInvoice ? "(Auto)" : "(Manual)"}
                  </span>
                )}
                {client.enablePaymentReminder && (
                  <span className='bg-amber-50 text-amber-700 border border-amber-100/80 px-2 py-0.5 rounded-md'>
                    Payment Alerts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
