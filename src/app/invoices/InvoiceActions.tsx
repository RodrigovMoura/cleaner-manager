"use client";

import { useState } from "react";
import { sendInvoiceEmail, updateInvoiceStatus } from "@/actions/invoice";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: "PENDING" | "PAID" | "OVERDUE";
  sentAt?: string | Date | null;
  clientEmail?: string | null;
}

export default function InvoiceActions({ invoiceId, currentStatus, sentAt, clientEmail }: InvoiceActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);

  const formattedLastSent = sentAt
    ? new Date(sentAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleMarkAsPaid = async (dateToUse?: string) => {
    setLoadingPayment(true);
    await updateInvoiceStatus(invoiceId, "PAID", dateToUse || paymentDate);
    setLoadingPayment(false);
    setIsPaymentModalOpen(false);
  };

  const handleMarkAsUnpaid = async () => {
    setLoadingPayment(true);
    await updateInvoiceStatus(invoiceId, "PENDING");
    setLoadingPayment(false);
  };

  const handleConfirmSendEmail = async () => {
    setSendingEmail(true);
    await sendInvoiceEmail(invoiceId);
    setSendingEmail(false);
    setIsEmailModalOpen(false);
  };

  return (
    <div className='flex items-center gap-2'>
      {/* Send / Resend Email Button */}
      <button
        onClick={() => setIsEmailModalOpen(true)}
        disabled={sendingEmail}
        title={formattedLastSent ? `Last sent on ${formattedLastSent}` : "Send invoice PDF to client"}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
          sentAt
            ? "border-gray-200 text-gray-600 hover:bg-gray-50"
            : "border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100"
        }`}>
        {sentAt ? "Resend" : "Send Invoice"}
      </button>

      {/* Payment Status Toggle */}
      {currentStatus === "PAID" ? (
        <button
          onClick={handleMarkAsUnpaid}
          disabled={loadingPayment}
          className='px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'>
          {loadingPayment ? "Updating..." : "Mark as Unpaid"}
        </button>
      ) : (
        <button
          onClick={() => {
            setPaymentDate(todayStr);
            setIsPaymentModalOpen(true);
          }}
          disabled={loadingPayment}
          className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
          Mark as Paid
        </button>
      )}

      {/* 1. Payment Date Modal */}
      {isPaymentModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
          onClick={() => setIsPaymentModalOpen(false)}>
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
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={loadingPayment}
                className='px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={() => handleMarkAsPaid(paymentDate)}
                disabled={loadingPayment || !paymentDate}
                className='px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
                {loadingPayment ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Email Confirmation Modal */}
      {isEmailModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
          onClick={() => setIsEmailModalOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100'>
            <div>
              <h3 className='text-base font-semibold text-gray-900'>
                {sentAt ? "Resend Invoice Email?" : "Send Invoice Email?"}
              </h3>
              {clientEmail && (
                <p className='text-xs text-gray-500 mt-1'>
                  Recipient: <span className='font-medium text-gray-700'>{clientEmail}</span>
                </p>
              )}
            </div>

            {sentAt ? (
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1'>
                <p className='font-semibold'>⚠️ Invoice already sent</p>
                <p>
                  This invoice was sent on <strong>{formattedLastSent}</strong>. Do you want to dispatch it again?
                </p>
              </div>
            ) : (
              <p className='text-xs text-gray-600'>
                The tax invoice PDF will be generated and sent directly to the client via email.
              </p>
            )}

            <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-100'>
              <button
                type='button'
                onClick={() => setIsEmailModalOpen(false)}
                disabled={sendingEmail}
                className='px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={handleConfirmSendEmail}
                disabled={sendingEmail}
                className='px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
                {sendingEmail ? "Sending..." : sentAt ? "Yes, Resend" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
