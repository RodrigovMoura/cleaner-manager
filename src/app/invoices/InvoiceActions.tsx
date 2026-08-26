"use client";

import { useState } from "react";
import { updateInvoiceStatus } from "@/actions/invoice";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: "PENDING" | "PAID" | "OVERDUE";
}

export default function InvoiceActions({ invoiceId, currentStatus }: InvoiceActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);

  const handleMarkAsPaid = async (dateToUse?: string) => {
    setLoading(true);
    await updateInvoiceStatus(invoiceId, "PAID", dateToUse || paymentDate);
    setLoading(false);
    setIsOpen(false);
  };

  const handleMarkAsUnpaid = async () => {
    setLoading(true);
    await updateInvoiceStatus(invoiceId, "PENDING");
    setLoading(false);
  };

  if (currentStatus === "PAID") {
    return (
      <button
        onClick={handleMarkAsUnpaid}
        disabled={loading}
        className='px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'>
        {loading ? "Updating..." : "Mark as Unpaid"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setPaymentDate(todayStr);
          setIsOpen(true);
        }}
        disabled={loading}
        className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
        Mark as Paid
      </button>

      {/* Payment Date Selection Modal */}
      {isOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
          onClick={() => setIsOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100'>
            <div>
              <h3 className='text-base font-semibold text-gray-900'>Record Payment</h3>
              <p className='text-xs text-gray-500 mt-0.5'>Select the date this payment was received.</p>
            </div>

            <div className='space-y-3'>
              <div>
                <label htmlFor='paymentDate' className='block text-xs font-medium text-gray-700 mb-1'>
                  Payment Date
                </label>
                <input
                  id='paymentDate'
                  type='date'
                  max={todayStr}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className='w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
              </div>

              {/* Quick shortcut to reset to Today */}
              {paymentDate !== todayStr && (
                <button
                  type='button'
                  onClick={() => setPaymentDate(todayStr)}
                  className='text-xs text-emerald-600 hover:underline font-medium'>
                  Set to Today
                </button>
              )}
            </div>

            <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-100'>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className='px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={() => handleMarkAsPaid(paymentDate)}
                disabled={loading || !paymentDate}
                className='px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
                {loading ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
