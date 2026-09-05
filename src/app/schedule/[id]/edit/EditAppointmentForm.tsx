"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/actions/appointment";
import { formatToDateTimeLocal } from "@/lib/date";

interface AppointmentData {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress?: string | null;
  date: string;
  price: number;
  status: string;
}

interface EditAppointmentFormProps {
  appointment: AppointmentData;
}

export default function EditAppointmentForm({ appointment }: EditAppointmentFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dateValue, setDateValue] = useState(() =>
    appointment.date ? formatToDateTimeLocal(appointment.date) : "",
  );
  const [priceValue, setPriceValue] = useState(appointment.price.toFixed(2));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const dateVal = formData.get("date") as string;
    if (dateVal) {
      const localDate = new Date(dateVal);
      if (!isNaN(localDate.getTime())) {
        formData.set("date", localDate.toISOString());
      }
    }

    const result = await updateAppointment(appointment.id, formData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
    } else {
      setStatus("error");
      setMessage(result.message || "Something went wrong.");
    }
  };

  const handleCloseModal = () => {
    if (status === "success") {
      router.push("/schedule");
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className='relative space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Edit Scheduled Cleaning</h1>
          <p className='text-sm text-gray-500 mt-1'>Update the date, time, or rate for this cleaning.</p>
        </div>
        <Link
          href='/schedule'
          className='text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors'>
          Cancel
        </Link>
      </div>

      {/* Main Form Card */}
      <div className='bg-white border border-gray-200 shadow-sm rounded-xl p-5 sm:p-7 space-y-6'>
        {/* Client Info Summary Banner */}
        <div className='p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div>
            <span className='block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5'>Client</span>
            <Link
              href={`/clients/${appointment.clientId}`}
              className='text-base font-bold text-gray-900 hover:text-blue-600 hover:underline'>
              {appointment.clientName}
            </Link>
            {appointment.clientAddress && (
              <p className='text-xs text-gray-500 mt-0.5'>{appointment.clientAddress}</p>
            )}
          </div>
          <span
            className={`self-start sm:self-auto text-xs font-bold px-2.5 py-1 rounded-full border ${
              appointment.status === "SCHEDULED"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : appointment.status === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-700 border-red-100"
            }`}>
            {appointment.status}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className='space-y-6'>
          {/* Date & Time + Price Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Date & Time */}
            <div className='space-y-1.5'>
              <label htmlFor='date' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Date & Time *
              </label>
              <input
                id='date'
                type='datetime-local'
                name='date'
                required
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className='w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
              />
            </div>

            {/* Price (AUD) */}
            <div className='space-y-1.5'>
              <label htmlFor='price' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Price (AUD) *
              </label>
              <div className='relative'>
                <span className='absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 font-medium text-sm'>
                  $
                </span>
                <input
                  id='price'
                  type='number'
                  name='price'
                  step='0.01'
                  min='0'
                  required
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder='120.00'
                  className='w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-100'>
            <Link
              href='/schedule'
              className='px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors'>
              Cancel
            </Link>
            <button
              type='submit'
              disabled={status === "loading"}
              className='px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'>
              {status === "loading" ? (
                <>
                  <svg className='animate-spin h-4 w-4 text-white' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Modal */}
      {(status === "success" || status === "error") && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'
          onClick={handleCloseModal}>
          <div
            className='bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200 border border-gray-100'
            onClick={(e) => e.stopPropagation()}>
            <div
              className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
                status === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
              }`}>
              {status === "success" ? (
                <svg className='h-7 w-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M5 13l4 4L19 7' />
                </svg>
              ) : (
                <svg className='h-7 w-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M6 18L18 6M6 6l12 12' />
                </svg>
              )}
            </div>

            <h3 className='text-lg font-bold text-gray-900 mb-1'>
              {status === "success" ? "Cleaning Updated!" : "Update Failed"}
            </h3>
            <p className='text-sm text-gray-500 mb-6'>{message}</p>

            <button
              onClick={handleCloseModal}
              className={`w-full py-2.5 px-4 text-sm font-semibold rounded-xl text-white transition-all shadow-xs ${
                status === "success" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-900"
              }`}>
              {status === "success" ? "Go to Schedule" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
