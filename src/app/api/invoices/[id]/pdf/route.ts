import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/components/InvoicePDF";
import React from "react";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        client: {
          userId: session.userId,
        },
      },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        appointment: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Convert decimal to primitive number for PDF rendering, with fallback to user bank details
    const formattedInvoice = {
      ...invoice,
      amount: Number(invoice.amount),
      paymentAccountName: invoice.paymentAccountName || invoice.client.user.bankAccountName,
      paymentBsb: invoice.paymentBsb || invoice.client.user.bankBsb,
      paymentAccountNo: invoice.paymentAccountNo || invoice.client.user.bankAccountNo,
      paymentPayId: invoice.paymentPayId || invoice.client.user.payId,
    };

    // Cast element as any to satisfy @react-pdf/renderer's strict DocumentProps requirement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice: formattedInvoice }) as any);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
