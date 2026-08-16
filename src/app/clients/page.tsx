import Link from "next/link";
import { getClients } from "@/actions/client";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className='max-w-4xl mx-auto p-6 text-gray-900'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Clients</h1>
          <p className='text-sm text-gray-500 mt-0.5'>Manage your clients and communication rules.</p>
        </div>
        <Link
          href='/clients/new'
          className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm'>
          + New Client
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-8 text-center'>
          <p className='text-gray-600 font-medium mb-1'>No clients found</p>
          <p className='text-sm text-gray-400 mb-4'>Add your first client to configure schedule and billing rules.</p>
          <Link
            href='/clients/new'
            className='inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors'>
            Add Client
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {clients.map((client) => (
            <div
              key={client.id}
              className='border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between'>
              <div>
                <div className='flex items-start justify-between gap-2'>
                  <Link
                    href={`/clients/${client.id}`}
                    className='hover:underline decoration-blue-500 underline-offset-2'>
                    <h2 className='text-base font-semibold text-gray-900'>{client.name}</h2>
                  </Link>
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className='text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 transition-colors'>
                    Edit
                  </Link>
                </div>
                {client.address && <p className='text-xs text-gray-500 mt-1'>{client.address}</p>}
                {client.email && <p className='text-xs text-gray-500 mt-0.5'>{client.email}</p>}
              </div>

              <div className='flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-100 text-[11px]'>
                {client.enableAppointmentReminder && (
                  <span className='bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium'>
                    Reminder ({client.reminderDaysBefore}d)
                  </span>
                )}
                {client.enableInvoice && (
                  <span className='bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium'>
                    Invoice {client.autoSendInvoice ? "(Auto)" : "(Manual)"}
                  </span>
                )}
                {client.enablePaymentReminder && (
                  <span className='bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium'>Payment Alerts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
