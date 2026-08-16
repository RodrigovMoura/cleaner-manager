import { getClients } from "@/actions/client";
import NewAppointmentForm from "./NewAppointmentForm";

export default async function NewSchedulePage() {
  const clients = await getClients();

  const clientOptions = clients.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  return (
    <div className='w-full min-h-screen flex justify-center items-center bg-[#F5F7F7] py-10 px-4'>
      <NewAppointmentForm clients={clientOptions} />
    </div>
  );
}
