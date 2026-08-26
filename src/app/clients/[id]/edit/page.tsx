import { notFound } from "next/navigation";
import { getClientById } from "@/actions/client";
import EditClientForm from "./EditClientForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const rawClient = await getClientById(id);

  if (!rawClient) {
    notFound();
  }

  // Serializa campos Decimal para tipos primitivos aceitos pelo Client Component
  const client = {
    ...rawClient,
    defaultPrice: rawClient.defaultPrice ? Number(rawClient.defaultPrice) : null,
    appointments:
      rawClient.appointments?.map((apt) => ({
        ...apt,
        price: Number(apt.price),
      })) || [],
  };

  return <EditClientForm client={client} />;
}
