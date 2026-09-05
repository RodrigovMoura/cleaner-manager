import { notFound } from "next/navigation";
import { getAppointmentById } from "@/actions/appointment";
import EditAppointmentForm from "./EditAppointmentForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSchedulePage({ params }: PageProps) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  return (
    <div className='max-w-2xl mx-auto p-4 sm:p-6 text-gray-900'>
      <EditAppointmentForm
        appointment={{
          id: appointment.id,
          clientId: appointment.clientId,
          clientName: appointment.client.name,
          clientAddress: appointment.client.address,
          date: appointment.date.toISOString(),
          price: Number(appointment.price),
          status: appointment.status,
        }}
      />
    </div>
  );
}
