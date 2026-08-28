import { getClients } from "@/actions/client";
import NewAppointmentForm from "./NewAppointmentForm";

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewSchedulePage({ searchParams }: PageProps) {
  const { clientId } = (await searchParams) || {};
  const clients = await getClients();

  const clientOptions = clients.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  return (
    <div className='max-w-2xl mx-auto p-4 sm:p-6 text-gray-900'>
      <NewAppointmentForm clients={clientOptions} defaultClientId={clientId} />
    </div>
  );
}
