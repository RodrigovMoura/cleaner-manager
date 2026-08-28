"use client";

import { useState, useEffect } from "react";
import { sendInvoiceEmail, updateInvoiceStatus } from "@/actions/invoice";

interface InvoiceActionsProps {
  invoiceId: string;
  currentStatus: "PENDING" | "PAID" | "OVERDUE";
  sentAt?: string | Date | null;
  clientEmail?: string | null;
}

interface ToastNotification {
  type: "success" | "error";
  title: string;
  message: string;
}

export default function InvoiceActions({ invoiceId, currentStatus, sentAt, clientEmail }: InvoiceActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === "error" ? 8000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    try {
      const res = await updateInvoiceStatus(invoiceId, "PAID", dateToUse || paymentDate);
      setLoadingPayment(false);
      setIsPaymentModalOpen(false);

      if (res.success) {
        setToast({
          type: "success",
          title: "Payment Recorded",
          message: res.message || "Invoice marked as paid!",
        });
      } else {
        setToast({
          type: "error",
          title: "Payment Update Failed",
          message: res.message || "Could not mark invoice as paid.",
        });
      }
    } catch (err: unknown) {
      setLoadingPayment(false);
      setIsPaymentModalOpen(false);
      setToast({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  };

  const handleMarkAsUnpaid = async () => {
    setLoadingPayment(true);
    try {
      const res = await updateInvoiceStatus(invoiceId, "PENDING");
      setLoadingPayment(false);

      if (res.success) {
        setToast({
          type: "success",
          title: "Status Updated",
          message: res.message || "Invoice marked as pending.",
        });
      } else {
        setToast({
          type: "error",
          title: "Update Failed",
          message: res.message || "Could not update invoice status.",
        });
      }
    } catch (err: unknown) {
      setLoadingPayment(false);
      setToast({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  };

  const handleConfirmSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await sendInvoiceEmail(invoiceId);
      setSendingEmail(false);
      setIsEmailModalOpen(false);

      if (res.success) {
        setToast({
          type: "success",
          title: "Email Sent Successfully",
          message: res.message || "Invoice email sent to client.",
        });
      } else {
        setToast({
          type: "error",
          title: "Failed to Send Email",
          message: res.message || "Could not send the invoice email.",
        });
      }
    } catch (err: unknown) {
      setSendingEmail(false);
      setIsEmailModalOpen(false);
      setToast({
        type: "error",
        title: "Failed to Send Email",
        message: err instanceof Error ? err.message : "An unexpected error occurred while sending the email.",
      });
    }
  };

  return (
    <>
      {/* Floating Toast Notification */}
      {toast && (
        <div className='fixed top-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto'>
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3.5 ${
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-950 shadow-emerald-500/10"
                : "bg-white border-red-200 text-red-950 shadow-red-500/10"
            }`}>
            {toast.type === "success" ? (
              <div className='p-1.5 bg-emerald-100 text-emerald-600 rounded-full shrink-0 mt-0.5'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M5 13l4 4L19 7' />
                </svg>
              </div>
            ) : (
              <div className='p-1.5 bg-red-100 text-red-600 rounded-full shrink-0 mt-0.5'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2.5'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
              </div>
            )}

            <div className='flex-1 pr-1'>
              <h4
                className={`text-xs sm:text-sm font-bold ${
                  toast.type === "success" ? "text-emerald-900" : "text-red-900"
                }`}>
                {toast.title}
              </h4>
              <p
                className={`text-xs mt-0.5 leading-relaxed break-words ${
                  toast.type === "success" ? "text-emerald-700" : "text-red-700"
                }`}>
                {toast.message}
              </p>
            </div>

            <button
              type='button'
              onClick={() => setToast(null)}
              aria-label='Close notification'
              className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors shrink-0'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className='flex items-center gap-2'>
        {/* Send / Resend Email Button */}
        <button
          onClick={() => setIsEmailModalOpen(true)}
          disabled={sendingEmail}
          title={formattedLastSent ? `Last sent on ${formattedLastSent}` : "Send invoice PDF to client"}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
            sentAt
              ? "border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs"
              : "border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 shadow-2xs"
          }`}>
          {sentAt ? "Resend" : "Send Invoice"}
        </button>

        {/* Payment Status Toggle */}
        {currentStatus === "PAID" ? (
          <button
            onClick={handleMarkAsUnpaid}
            disabled={loadingPayment}
            className='px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-lg transition-all shadow-2xs disabled:opacity-50'>
            {loadingPayment ? "Updating..." : "Mark as Unpaid"}
          </button>
        ) : (
          <button
            onClick={() => {
              setPaymentDate(todayStr);
              setIsPaymentModalOpen(true);
            }}
            disabled={loadingPayment}
            className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-all shadow-2xs disabled:opacity-50'>
            Mark as Paid
          </button>
        )}

        {/* 1. Payment Date Modal */}
        {isPaymentModalOpen && (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'
            onClick={() => setIsPaymentModalOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-gray-100'>
              <div>
                <h3 className='text-base font-bold text-gray-900'>Record Payment</h3>
                <p className='text-xs text-gray-500 mt-0.5'>Select the date this payment was received.</p>
              </div>

              <div className='space-y-2'>
                <label htmlFor='paymentDate' className='block text-xs font-semibold text-gray-700'>
                  Payment Date
                </label>
                <input
                  id='paymentDate'
                  type='date'
                  max={todayStr}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className='w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                />

                {paymentDate !== todayStr && (
                  <button
                    type='button'
                    onClick={() => setPaymentDate(todayStr)}
                    className='text-xs text-emerald-600 hover:underline font-semibold'>
                    Set to Today
                  </button>
                )}
              </div>

              <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={loadingPayment}
                  className='px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors'>
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={() => handleMarkAsPaid(paymentDate)}
                  disabled={loadingPayment || !paymentDate}
                  className='px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs disabled:opacity-50'>
                  {loadingPayment ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Email Confirmation Modal */}
        {isEmailModalOpen && (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'
            onClick={() => !sendingEmail && setIsEmailModalOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-gray-100'>
              <div>
                <h3 className='text-base font-bold text-gray-900'>
                  {sentAt ? "Resend Invoice Email?" : "Send Invoice Email?"}
                </h3>
                {clientEmail ? (
                  <p className='text-xs text-gray-500 mt-1'>
                    Recipient: <span className='font-semibold text-gray-800'>{clientEmail}</span>
                  </p>
                ) : (
                  <div className='bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mt-2 space-y-0.5'>
                    <p className='font-bold'>⚠️ No email address</p>
                    <p>This client has no email registered. Please update client details first.</p>
                  </div>
                )}
              </div>

              {sentAt ? (
                <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1'>
                  <p className='font-bold'>⚠️ Invoice already sent</p>
                  <p>
                    This invoice was sent on <strong>{formattedLastSent}</strong>. Do you want to dispatch it again?
                  </p>
                </div>
              ) : clientEmail ? (
                <p className='text-xs text-gray-600 leading-relaxed'>
                  The tax invoice PDF will be attached and delivered directly to the client via email.
                </p>
              ) : null}

              <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={sendingEmail}
                  className='px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50'>
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleConfirmSendEmail}
                  disabled={sendingEmail || !clientEmail}
                  className='px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5'>
                  {sendingEmail && (
                    <svg className='animate-spin h-3.5 w-3.5 text-white' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                  )}
                  {sendingEmail ? "Sending..." : sentAt ? "Yes, Resend" : "Confirm & Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
