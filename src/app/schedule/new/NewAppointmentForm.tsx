"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/actions/appointment";

interface ClientOption {
  id: string;
  name: string;
}

interface NewAppointmentFormProps {
  clients: ClientOption[];
  defaultClientId?: string;
}

export default function NewAppointmentForm({ clients, defaultClientId }: NewAppointmentFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "biweekly">("none");
  const [occurrences, setOccurrences] = useState("3");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const result = await createAppointment(formData);

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

  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div className='relative space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Schedule Cleaning</h1>
          <p className='text-sm text-gray-500 mt-1'>Book a single cleaning or set up a recurring schedule.</p>
        </div>
        <Link
          href='/schedule'
          className='text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors'>
          Cancel
        </Link>
      </div>

      {/* Main Form Card */}
      <div className='bg-white border border-gray-200 shadow-sm rounded-xl p-5 sm:p-7 space-y-6'>
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent accidental form submission when pressing Enter in inputs
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className='space-y-6'>
          {/* Client Selection */}
          <div className='space-y-1.5'>
            <label htmlFor='clientId' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
              Client *
            </label>
            <div className='relative'>
              <select
                id='clientId'
                name='clientId'
                required
                defaultValue={defaultClientId || ""}
                className='w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'>
                <option value='' disabled>
                  Select a client...
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
                </svg>
              </div>
            </div>
            {clients.length === 0 && (
              <p className='text-xs text-amber-600 mt-1'>
                No clients found.{" "}
                <Link href='/clients/new' className='underline font-semibold'>
                  Create a client
                </Link>{" "}
                first.
              </p>
            )}
          </div>

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
                min={minDateTime}
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
                  placeholder='120.00'
                  className='w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
                />
              </div>
            </div>
          </div>

          {/* Recurrence Frequency */}
          <div className='space-y-2 pt-2 border-t border-gray-100'>
            <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>Frequency</label>
            <div className='grid grid-cols-2 gap-2 bg-gray-100/80 p-1 rounded-xl'>
              <label
                className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  recurrence === "none"
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}>
                <input
                  type='radio'
                  name='recurrence'
                  value='none'
                  checked={recurrence === "none"}
                  onChange={() => setRecurrence("none")}
                  className='sr-only'
                />
                <span>One-time</span>
              </label>

              <label
                className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  recurrence === "biweekly"
                    ? "bg-white text-blue-700 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}>
                <input
                  type='radio'
                  name='recurrence'
                  value='biweekly'
                  checked={recurrence === "biweekly"}
                  onChange={() => setRecurrence("biweekly")}
                  className='sr-only'
                />
                <span>Bi-weekly (Every 2 weeks)</span>
              </label>
            </div>
          </div>

          {/* Bi-weekly Occurrences Picker */}
          {recurrence === "biweekly" && (
            <div className='p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3 animate-in fade-in duration-200'>
              <span className='block text-xs font-semibold text-blue-900 uppercase tracking-wider'>
                How many recurring visits to create?
              </span>
              <div className='grid grid-cols-3 gap-2.5'>
                {[
                  { value: "3", label: "3 visits", sub: "~1.5 months" },
                  { value: "6", label: "6 visits", sub: "~3 months" },
                  { value: "12", label: "12 visits", sub: "~6 months" },
                ].map((opt) => {
                  const isSelected = occurrences === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-xs text-blue-900 ring-2 ring-blue-500/20"
                          : "bg-white/80 border-gray-200 text-gray-700 hover:bg-white"
                      }`}>
                      <input
                        type='radio'
                        name='occurrences'
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setOccurrences(opt.value)}
                        className='sr-only'
                      />
                      <span className='text-sm font-bold'>{opt.label}</span>
                      <span className='text-[10px] text-gray-500 mt-0.5'>{opt.sub}</span>
                    </label>
                  );
                })}
              </div>
              <p className='text-xs text-blue-700/80'>
                💡 Individual appointments can still be rescheduled or cancelled anytime from the Schedule page.
              </p>
            </div>
          )}

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
                  <span>Scheduling...</span>
                </>
              ) : (
                "Confirm Schedule"
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
              {status === "success" ? "Booking Confirmed!" : "Couldn't Schedule"}
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
