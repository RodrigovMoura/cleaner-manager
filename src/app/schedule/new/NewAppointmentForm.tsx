"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/actions/appointment";

interface ClientOption {
  id: string;
  name: string;
}

export default function NewAppointmentForm({ clients }: { clients: ClientOption[] }) {
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

  return (
    <>
      <div className='relative w-full max-w-md'>
        <button
          onClick={handleCloseModal}
          aria-label='Cancel'
          className='absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#D8E2E0] bg-white text-[#5C6F6D] shadow-sm transition hover:border-[#1F7A64] hover:text-[#1F7A64]'>
          ✕
        </button>

        {/* Ticket card */}
        <div className='overflow-hidden rounded-b-2xl bg-white shadow-[0_20px_50px_-20px_rgba(31,122,100,0.35)]'>
          {/* Perforated edge */}

          <div className='px-8 pt-6 pb-8' style={{ fontFamily: "Inter, sans-serif" }}>
            <span
              className='inline-block rounded-full bg-[#DCEFE9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1F7A64]'
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              New Booking · Cleaning Service
            </span>

            <h2
              className='mt-3 text-2xl font-semibold tracking-tight text-[#1B2B2A]'
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Schedule a cleaning
            </h2>
            <p className='mt-1 text-sm leading-relaxed text-[#5C6F6D]'>
              Book a single visit, or set up a recurring bi-weekly schedule.
            </p>

            <form onSubmit={handleSubmit} className='mt-7 flex flex-col gap-5'>
              {/* Client */}
              <div>
                <label
                  htmlFor='clientId'
                  className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C6F6D]'>
                  Client
                </label>
                <div className='relative mt-1.5'>
                  <select
                    id='clientId'
                    name='clientId'
                    required
                    defaultValue=''
                    className='w-full appearance-none border-0 border-b-2 border-[#D8E2E0] bg-transparent py-2 pr-6 text-sm text-[#1B2B2A] outline-none transition-colors focus:border-[#1F7A64]'>
                    <option value='' disabled>
                      Select a client
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className='pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[#5C6F6D]'>
                    ▾
                  </span>
                </div>
              </div>

              {/* Date & Price */}
              <div className='grid grid-cols-2 gap-5'>
                <div>
                  <label
                    htmlFor='date'
                    className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C6F6D]'>
                    Date & time
                  </label>
                  <input
                    id='date'
                    type='datetime-local'
                    name='date'
                    required
                    className='mt-1.5 w-full border-0 border-b-2 border-[#D8E2E0] bg-transparent py-2 text-sm text-[#1B2B2A] outline-none transition-colors focus:border-[#1F7A64]'
                  />
                </div>
                <div>
                  <label
                    htmlFor='price'
                    className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C6F6D]'>
                    Price (AUD)
                  </label>
                  <div className='mt-1.5 flex items-center border-b-2 border-[#D8E2E0] transition-colors focus-within:border-[#1F7A64]'>
                    <span className='text-sm text-[#5C6F6D]'>$</span>
                    <input
                      id='price'
                      type='number'
                      name='price'
                      step='0.01'
                      min='0'
                      required
                      placeholder='0.00'
                      className='w-full border-0 bg-transparent py-2 pl-1 text-sm text-[#1B2B2A] outline-none'
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence segmented control */}
              <div>
                <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C6F6D]'>Frequency</span>
                <div className='mt-1.5 grid grid-cols-2 gap-2 rounded-full bg-[#F5F7F7] p-1'>
                  {(
                    [
                      { value: "none", label: "One-time" },
                      { value: "biweekly", label: "Bi-weekly" },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className='cursor-pointer'>
                      <input
                        type='radio'
                        name='recurrence'
                        value={opt.value}
                        checked={recurrence === opt.value}
                        onChange={() => setRecurrence(opt.value)}
                        className='peer sr-only'
                      />
                      <span
                        className={`block rounded-full py-2 text-center text-sm font-medium transition-colors ${
                          recurrence === opt.value
                            ? "bg-[#1F7A64] text-white shadow-sm"
                            : "text-[#5C6F6D] hover:text-[#1B2B2A]"
                        }`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Occurrences */}
              {recurrence === "biweekly" && (
                <div className='rounded-xl border border-dashed border-[#BFE0D6] bg-[#F5FAF9] p-4'>
                  <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C6F6D]'>
                    How many upcoming cleanings?
                  </span>
                  <div className='mt-2 grid grid-cols-3 gap-2'>
                    {[
                      { value: "3", label: "3", sub: "~1.5 mo" },
                      { value: "6", label: "6", sub: "~3 mo" },
                      { value: "12", label: "12", sub: "~6 mo" },
                    ].map((opt) => (
                      <label key={opt.value} className='cursor-pointer'>
                        <input
                          type='radio'
                          name='occurrences'
                          value={opt.value}
                          checked={occurrences === opt.value}
                          onChange={() => setOccurrences(opt.value)}
                          className='peer sr-only'
                        />
                        <span
                          className={`flex flex-col items-center rounded-lg border py-2 text-sm font-semibold transition-colors ${
                            occurrences === opt.value
                              ? "border-[#1F7A64] bg-white text-[#1F7A64]"
                              : "border-transparent text-[#5C6F6D] hover:bg-white/60"
                          }`}>
                          {opt.label}
                          <span className='text-[10px] font-normal text-[#8AA19D]'>{opt.sub}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className='mt-3 text-xs leading-relaxed text-[#5C6F6D]'>
                    You can manage or cancel individual appointments later.
                  </p>
                </div>
              )}

              {/* Ticket stub / submit */}
              <div className='mt-2 border-t-2 border-dashed border-[#D8E2E0] pt-5'>
                <button
                  type='submit'
                  disabled={status === "loading"}
                  className='flex w-full items-center justify-center gap-2 rounded-full bg-[#1F7A64] py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-[#1B6A57] disabled:cursor-not-allowed disabled:opacity-60'
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {status === "loading" ? (
                    <>
                      <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
                      Scheduling…
                    </>
                  ) : (
                    "Confirm schedule"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      {(status === "success" || status === "error") && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-[#0F1A18]/50 backdrop-blur-sm'
          onClick={handleCloseModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className='mx-4 flex w-full max-w-xs flex-col items-center rounded-2xl bg-white px-8 py-9 text-center shadow-2xl'
            style={{ fontFamily: "Inter, sans-serif" }}>
            <div
              className={`flex h-16 w-16 -rotate-6 items-center justify-center rounded-full border-4 border-dashed text-2xl font-bold ${
                status === "success" ? "border-[#1F7A64] text-[#1F7A64]" : "border-[#B3492F] text-[#B3492F]"
              }`}>
              {status === "success" ? "✓" : "✕"}
            </div>
            <h3
              className='mt-4 text-lg font-semibold tracking-tight text-[#1B2B2A]'
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {status === "success" ? "Booking confirmed" : "Couldn't schedule"}
            </h3>
            <p className='mt-1.5 text-sm leading-relaxed text-[#5C6F6D]'>{message}</p>
            <button
              onClick={handleCloseModal}
              className={`mt-6 w-full rounded-full py-2.5 text-sm font-semibold text-white transition ${
                status === "success" ? "bg-[#1F7A64] hover:bg-[#1B6A57]" : "bg-[#B3492F] hover:bg-[#9C3E28]"
              }`}>
              {status === "success" ? "Go to schedule" : "Try again"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
