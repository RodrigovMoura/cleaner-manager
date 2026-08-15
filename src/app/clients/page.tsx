import Link from "next/link";
import { getClients } from "@/actions/client";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className='max-w-4xl mx-auto p-6 text-gray-800'>
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
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
          <p className='text-gray-500 mb-2'>You don&apos;t have any clients registered yet.</p>
          <p className='text-sm text-gray-400'>Add your first client to set up reminder and billing rules.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {clients.map((client: any) => (
            <div
              key={client.id}
              className='border border-gray-200 p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow'>
              <h2 className='text-lg font-semibold'>{client.name}</h2>
              {/* In the future, we will add badges here indicating if the reminders/bills are active */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
