import { notFound } from "next/navigation";
import { getClientById } from "@/actions/client";
import EditClientForm from "./EditClientForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return <EditClientForm client={client} />;
}
