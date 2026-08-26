"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateClient, deleteClient } from "@/actions/client";

interface ClientData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  defaultPrice?: number | null;
  enableAppointmentReminder: boolean;
  reminderDaysBefore: number;
  enableInvoice: boolean;
  autoSendInvoice: boolean;
  enablePaymentReminder: boolean;
}

export default function EditClientForm({ client }: { client: ClientData }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setStatus("loading");

    const result = await updateClient(client.id, formData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
    } else {
      setStatus("error");
      setMessage(result.message || "Something went wrong.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteClient(client.id);

    if (result && !result.success) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setStatus("error");
      setMessage(result.message || "Failed to delete client.");
    }
  };

  const handleCloseModal = () => {
    if (status === "success") {
      router.push("/clients");
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6 text-gray-900 relative'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Edit Client</h1>
          <p className='text-sm text-gray-500 mt-1'>Update client details and automation rules.</p>
        </div>
        <Link
          href='/clients'
          className='text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors'>
          Cancel
        </Link>
      </div>

      <form action={handleSubmit} className='space-y-8'>
        {/* Contact Information */}
        <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-4'>
          <h2 className='text-base font-semibold text-gray-900 border-b border-gray-100 pb-3'>General Information</h2>

          <div className='space-y-4'>
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name *
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                defaultValue={client.name}
                placeholder='e.g. Sarah Jenkins'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                  Email Address
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  defaultValue={client.email || ""}
                  placeholder='sarah@example.com'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number
                </label>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  defaultValue={client.phone || ""}
                  placeholder='+61 400 000 000'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <div>
              <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-1'>
                Property Address
              </label>
              <input
                id='address'
                name='address'
                type='text'
                defaultValue={client.address || ""}
                placeholder='123 Ocean Street, Suburb'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Granular Toggles */}
        <div className='bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-6'>
          <h2 className='text-base font-semibold text-gray-900 border-b border-gray-100 pb-3'>
            Automation & Notification Preferences
          </h2>

          {/* Appointment Reminder */}
          <div className='space-y-3'>
            <div className='flex items-start justify-between'>
              <div className='pr-4'>
                <label htmlFor='enableAppointmentReminder' className='text-sm font-medium text-gray-900 block'>
                  Appointment Reminders
                </label>
                <p className='text-xs text-gray-500'>
                  Send an automatic reminder message prior to scheduled cleanings.
                </p>
              </div>
              <input
                id='enableAppointmentReminder'
                name='enableAppointmentReminder'
                type='checkbox'
                defaultChecked={client.enableAppointmentReminder}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer'
              />
            </div>

            <div className='pl-0 sm:pl-4 border-l-2 border-gray-100'>
              <label htmlFor='reminderDaysBefore' className='block text-xs font-medium text-gray-600 mb-1'>
                Send reminder
              </label>
              <select
                id='reminderDaysBefore'
                name='reminderDaysBefore'
                defaultValue={client.reminderDaysBefore.toString()}
                className='px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'>
                <option value='1'>1 day before</option>
                <option value='2'>2 days before</option>
              </select>
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Invoices */}
          <div className='space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='pr-4'>
                <label htmlFor='enableInvoice' className='text-sm font-medium text-gray-900 block'>
                  Generate Invoices
                </label>
                <p className='text-xs text-gray-500'>Enable invoice generation when cleanings are completed.</p>
              </div>
              <input
                id='enableInvoice'
                name='enableInvoice'
                type='checkbox'
                defaultChecked={client.enableInvoice}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer'
              />
            </div>

            <div className='flex items-start justify-between pl-0 sm:pl-4 border-l-2 border-gray-100'>
              <div className='pr-4'>
                <label htmlFor='autoSendInvoice' className='text-xs font-medium text-gray-800 block'>
                  Automatic Invoice Delivery
                </label>
                <p className='text-xs text-gray-500'>
                  Automatically email invoice on completion (uncheck for 1-click manual review).
                </p>
              </div>
              <input
                id='autoSendInvoice'
                name='autoSendInvoice'
                type='checkbox'
                defaultChecked={client.autoSendInvoice}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer'
              />
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Payment Reminders */}
          <div className='flex items-start justify-between'>
            <div className='pr-4'>
              <label htmlFor='enablePaymentReminder' className='text-sm font-medium text-gray-900 block'>
                Overdue Payment Reminders
              </label>
              <p className='text-xs text-gray-500'>Allow payment follow-up notifications for overdue invoices.</p>
            </div>
            <input
              id='enablePaymentReminder'
              name='enablePaymentReminder'
              type='checkbox'
              defaultChecked={client.enablePaymentReminder}
              className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer'
            />
          </div>
        </div>

        <div className='flex items-center justify-end gap-3 pt-2'>
          <Link
            href='/clients'
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
            Cancel
          </Link>
          <button
            type='submit'
            disabled={status === "loading" || isDeleting}
            className='px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed'>
            {status === "loading" ? "Saving..." : "Update Client"}
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete Client */}
      <div className='mt-12 pt-6 border-t border-red-100'>
        <div className='bg-red-50/60 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h3 className='text-sm font-semibold text-red-900'>Delete this client</h3>
            <p className='text-xs text-red-700 mt-0.5'>Permanently remove this client and their automation settings.</p>
          </div>
          <button
            type='button'
            onClick={() => setShowDeleteConfirm(true)}
            className='px-4 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors shrink-0'>
            Delete Client
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
          onClick={() => setShowDeleteConfirm(false)}>
          <div
            className='bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center'
            onClick={(e) => e.stopPropagation()}>
            <div className='mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4'>
              <svg className='h-7 w-7 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Delete Client?</h3>
            <p className='text-sm text-gray-500 mb-6'>
              Are you sure you want to delete <span className='font-semibold text-gray-700'>{client.name}</span>? This
              action cannot be undone.
            </p>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => setShowDeleteConfirm(false)}
                className='w-1/2 px-4 py-2.5 bg-gray-100 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDelete}
                disabled={isDeleting}
                className='w-1/2 px-4 py-2.5 bg-red-600 text-sm font-medium text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70'>
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal (Success / Error) */}
      {(status === "success" || status === "error") && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'
          onClick={handleCloseModal}>
          <div
            className='bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center'
            onClick={(e) => e.stopPropagation()}>
            <div
              className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${status === "success" ? "bg-emerald-100" : "bg-red-100"}`}>
              {status === "success" ? (
                <svg className='h-7 w-7 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                </svg>
              ) : (
                <svg className='h-7 w-7 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              )}
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>{status === "success" ? "Success!" : "Error"}</h3>
            <p className='text-sm text-gray-500 mb-6'>{message}</p>
            <button
              onClick={handleCloseModal}
              className='w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-2.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
