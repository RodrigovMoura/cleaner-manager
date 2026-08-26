"use client";

import { useState } from "react";
import { updateInvoiceStatus } from "@/actions/invoice";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: "PENDING" | "PAID" | "OVERDUE";
}

export default function InvoiceActions({ invoiceId, currentStatus }: InvoiceActionsProps) {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: "PENDING" | "PAID" | "OVERDUE") => {
    setLoadingStatus(newStatus);
    await updateInvoiceStatus(invoiceId, newStatus);
    setLoadingStatus(null);
  };

  if (currentStatus === "PAID") {
    return (
      <div className='flex items-center gap-2'>
        <button
          onClick={() => handleStatusChange("PENDING")}
          disabled={loadingStatus !== null}
          className='px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'>
          {loadingStatus === "PENDING" ? "Updating..." : "Mark as Unpaid"}
        </button>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={() => handleStatusChange("PAID")}
        disabled={loadingStatus !== null}
        className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
        {loadingStatus === "PAID" ? "Saving..." : "Mark as Paid"}
      </button>
    </div>
  );
}
