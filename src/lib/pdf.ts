import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import React from "react";
import InvoicePDF from "@/components/InvoicePDF";

interface GenerateInvoicePdfBufferProps {
  invoice: {
    invoiceNumber: string;
    amount: number | string;
    dueDate: Date;
    createdAt: Date;
    client: {
      name: string;
      email?: string | null;
      phone: string;
      address: string;
    };
    status: string;
  };
}

export async function generateInvoicePdfBuffer(data: GenerateInvoicePdfBufferProps): Promise<Buffer> {
  const element = React.createElement(InvoicePDF, {
    invoice: {
      ...data.invoice,
      amount: Number(data.invoice.amount),
    },
  });

  // Type cast para satisfazer a tipagem estrita do renderToBuffer
  return await renderToBuffer(element as unknown as React.ReactElement<DocumentProps>);
}
