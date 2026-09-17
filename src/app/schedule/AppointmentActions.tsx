"use client";

import { useState, useEffect } from "react";
import { updateAppointmentStatus, updateAppointment } from "@/actions/appointment";
import { createInvoiceForAppointment } from "@/actions/invoice";
import { formatToDateTimeLocal, formatDuration } from "@/lib/date";

interface AppointmentActionsProps {
  appointmentId: string;
  currentStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  clientName?: string;
  initialDate?: string | Date;
  initialPrice?: number;
  clientPreferredPaymentMethod?: "BANK_TRANSFER" | "CASH" | string;
  clientHourlyRate?: number;
  hasInvoice?: boolean;
}

export default function AppointmentActions({
  appointmentId,
  currentStatus,
  clientName,
  initialDate,
  initialPrice,
  clientPreferredPaymentMethod = "BANK_TRANSFER",
  clientHourlyRate = 50,
  hasInvoice = false,
}: AppointmentActionsProps) {
  const hourlyRate = clientHourlyRate > 0 ? clientHourlyRate : 50;

  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"BANK_TRANSFER" | "CASH">(
    clientPreferredPaymentMethod === "CASH" ? "CASH" : "BANK_TRANSFER",
  );
  const [editDate, setEditDate] = useState(() => (initialDate ? formatToDateTimeLocal(initialDate) : ""));
  const [editPrice, setEditPrice] = useState(() =>
    initialPrice !== undefined && initialPrice !== null ? Number(initialPrice).toFixed(2) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Time variance state for completion modal
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [completePrice, setCompletePrice] = useState(() =>
    initialPrice !== undefined && initialPrice !== null ? Number(initialPrice).toFixed(2) : "0.00",
  );
  const [isCustomPrice, setIsCustomPrice] = useState(false);

  const calculateDefaultDuration = () => {
    const basePrice = initialPrice !== undefined && initialPrice !== null ? Number(initialPrice) : 0;
    const totalMinutes = hourlyRate > 0 ? Math.round((basePrice / hourlyRate) * 60) : 120;
    return {
      h: Math.floor(totalMinutes / 60),
      m: totalMinutes % 60,
      price: basePrice.toFixed(2),
    };
  };

  const handleOpenEditModal = () => {
    if (initialDate) {
      setEditDate(formatToDateTimeLocal(initialDate));
    }
    if (initialPrice !== undefined && initialPrice !== null) {
      setEditPrice(Number(initialPrice).toFixed(2));
    }
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenCompleteModal = () => {
    setSelectedPaymentMethod(clientPreferredPaymentMethod === "CASH" ? "CASH" : "BANK_TRANSFER");
    const defaults = calculateDefaultDuration();
    setDurationHours(defaults.h);
    setDurationMinutes(defaults.m);
    setCompletePrice(defaults.price);
    setIsCustomPrice(false);
    setCompleteError(null);
    setIsCompleteModalOpen(true);
  };

  const handleDurationChange = (newH: number, newM: number) => {
    const totalM = Math.max(0, newH * 60 + newM);
    const h = Math.floor(totalM / 60);
    const m = totalM % 60;
    setDurationHours(h);
    setDurationMinutes(m);
    if (!isCustomPrice) {
      const calcPrice = (totalM / 60) * hourlyRate;
      setCompletePrice(calcPrice.toFixed(2));
    }
  };

  const handleDeltaMinutes = (delta: number) => {
    const totalM = Math.max(0, durationHours * 60 + durationMinutes + delta);
    handleDurationChange(Math.floor(totalM / 60), totalM % 60);
  };

  const handleResetToAutoPrice = () => {
    const totalM = durationHours * 60 + durationMinutes;
    const calcPrice = (totalM / 60) * hourlyRate;
    setCompletePrice(calcPrice.toFixed(2));
    setIsCustomPrice(false);
  };

  const handleConfirmComplete = async () => {
    setLoadingStatus("COMPLETED");
    setCompleteError(null);
    const totalMinutes = durationHours * 60 + durationMinutes;
    const parsedPrice = parseFloat(completePrice);
    const result = await updateAppointmentStatus(
      appointmentId,
      "COMPLETED",
      selectedPaymentMethod,
      isNaN(parsedPrice) ? undefined : parsedPrice,
      totalMinutes,
    );
    setLoadingStatus(null);
    if (result.success) {
      setIsCompleteModalOpen(false);
    } else {
      setCompleteError(result.message || "Failed to complete cleaning.");
    }
  };

  const handleStatusChange = async (
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED",
    paymentMethod?: "BANK_TRANSFER" | "CASH",
  ) => {
    setLoadingStatus(newStatus);
    const result = await updateAppointmentStatus(appointmentId, newStatus, paymentMethod);
    setLoadingStatus(null);
    if (!result.success && result.message) {
      alert(result.message);
    }
  };

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const result = await createInvoiceForAppointment(appointmentId);
      if (!result.success && result.message) {
        alert(result.message);
      }
    } catch {
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const dateVal = formData.get("date") as string;
      if (dateVal) {
        const localDate = new Date(dateVal);
        if (!isNaN(localDate.getTime())) {
          formData.set("date", localDate.toISOString());
        }
      }

      const result = await updateAppointment(appointmentId, formData);
      if (result.success) {
        setIsEditModalOpen(false);
      } else {
        setFormError(result.message || "Failed to update appointment.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving && loadingStatus === null) {
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isCompleteModalOpen) setIsCompleteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen, isCompleteModalOpen, isSaving, loadingStatus]);

  return (
    <>
      {currentStatus === "SCHEDULED" ? (
        <div className='flex items-center gap-1.5 flex-wrap sm:flex-nowrap'>
          <button
            type='button'
            onClick={handleOpenCompleteModal}
            disabled={loadingStatus !== null || isSaving}
            className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1'>
            {loadingStatus === "COMPLETED" ? (
              <>
                <span className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                <span>Completing...</span>
              </>
            ) : (
              "Mark as Completed"
            )}
          </button>

          <button
            type='button'
            onClick={handleOpenEditModal}
            disabled={loadingStatus !== null || isSaving}
            className='px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 active:bg-blue-200/80 border border-blue-200/80 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5'
            title='Edit scheduled date and time'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
              />
            </svg>
            <span>Edit</span>
          </button>

          <button
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={loadingStatus !== null || isSaving}
            className='px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50'>
            {loadingStatus === "CANCELLED" ? "..." : "Cancel"}
          </button>
        </div>
      ) : (
        <div className='flex items-center gap-1.5 flex-wrap'>
          {currentStatus === "COMPLETED" && !hasInvoice && (
            <button
              type='button'
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice || loadingStatus !== null || isSaving}
              className='px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/80 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 shadow-2xs'
              title='Generate and send invoice for this completed cleaning'>
              {isGeneratingInvoice ? (
                <>
                  <span className='w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin' />
                  <span>Invoicing...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Create Invoice</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleStatusChange("SCHEDULED")}
            disabled={loadingStatus !== null || isSaving || isGeneratingInvoice}
            className='px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1'>
            {loadingStatus === "SCHEDULED" ? (
              <>
                <span className='w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin' />
                <span>Reopening...</span>
              </>
            ) : (
              "Reopen"
            )}
          </button>

          <button
            type='button'
            onClick={handleOpenEditModal}
            disabled={loadingStatus !== null || isSaving || isGeneratingInvoice}
            className='px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1'
            title='Edit date and time'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
              />
            </svg>
            <span>Edit</span>
          </button>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {isEditModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150'
          onClick={() => !isSaving && setIsEditModalOpen(false)}>
          <div
            className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 text-left border border-gray-100 animate-in zoom-in-95 duration-150'
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>Edit Scheduled Cleaning</h3>
                {clientName && (
                  <p className='text-xs text-gray-500 mt-0.5'>
                    Client: <strong className='text-gray-800 font-semibold'>{clientName}</strong>
                  </p>
                )}
              </div>
              <button
                type='button'
                onClick={() => !isSaving && setIsEditModalOpen(false)}
                className='text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors'
                aria-label='Close modal'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2'>
                <svg className='w-4 h-4 shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <circle cx='12' cy='12' r='10' strokeWidth='2' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01' />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <label
                  htmlFor={`edit-date-${appointmentId}`}
                  className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Date & Time *
                </label>
                <input
                  id={`edit-date-${appointmentId}`}
                  type='datetime-local'
                  name='date'
                  required
                  value={editDate}
                  onChange={(e) => {
                    setEditDate(e.target.value);
                    setFormError(null);
                  }}
                  className='w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
                />
              </div>

              <div className='space-y-1.5'>
                <label
                  htmlFor={`edit-price-${appointmentId}`}
                  className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Price (AUD) *
                </label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 font-medium text-sm'>
                    $
                  </span>
                  <input
                    id={`edit-price-${appointmentId}`}
                    type='number'
                    name='price'
                    step='0.01'
                    min='0'
                    required
                    value={editPrice}
                    onChange={(e) => {
                      setEditPrice(e.target.value);
                      setFormError(null);
                    }}
                    placeholder='120.00'
                    className='w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
                  />
                </div>
              </div>

              <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100'>
                <button
                  type='button'
                  disabled={isSaving}
                  onClick={() => setIsEditModalOpen(false)}
                  className='px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50'>
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSaving}
                  className='px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed'>
                  {isSaving ? (
                    <>
                      <span className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal (Cash vs Bank Transfer) */}
      {isCompleteModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150'
          onClick={() => loadingStatus === null && setIsCompleteModalOpen(false)}>
          <div
            className='bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 text-left border border-gray-100 animate-in zoom-in-95 duration-150'
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>Complete Cleaning</h3>
                {clientName && (
                  <p className='text-xs text-gray-500 mt-0.5'>
                    Client: <strong className='text-gray-800 font-semibold'>{clientName}</strong>
                  </p>
                )}
              </div>
              <button
                type='button'
                onClick={() => loadingStatus === null && setIsCompleteModalOpen(false)}
                className='text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors'
                aria-label='Close modal'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Error banner */}
            {completeError && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2'>
                <svg className='w-4 h-4 shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <circle cx='12' cy='12' r='10' strokeWidth='2' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01' />
                </svg>
                <span>{completeError}</span>
              </div>
            )}

            {/* Actual Time Worked & Rate */}
            <div className='p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Actual Time Worked
                </label>
                <span className='text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200'>
                  ${hourlyRate.toFixed(2)} / hr
                </span>
              </div>

              <div className='flex items-center gap-2'>
                {/* Hours */}
                <div className='flex-1'>
                  <label className='block text-[11px] font-medium text-gray-500 mb-1'>Hours</label>
                  <div className='flex items-center gap-1'>
                    <input
                      type='number'
                      min='0'
                      max='24'
                      value={durationHours}
                      onChange={(e) =>
                        handleDurationChange(Math.max(0, parseInt(e.target.value, 10) || 0), durationMinutes)
                      }
                      className='w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    />
                    <span className='text-xs text-gray-500 font-medium'>h</span>
                  </div>
                </div>

                {/* Minutes */}
                <div className='flex-1'>
                  <label className='block text-[11px] font-medium text-gray-500 mb-1'>Minutes</label>
                  <div className='flex items-center gap-1'>
                    <input
                      type='number'
                      min='0'
                      max='59'
                      step='5'
                      value={durationMinutes}
                      onChange={(e) =>
                        handleDurationChange(durationHours, Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))
                      }
                      className='w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    />
                    <span className='text-xs text-gray-500 font-medium'>m</span>
                  </div>
                </div>

                {/* Quick adjustments +/- 15m */}
                <div className='flex flex-col items-end gap-1'>
                  <span className='text-[10px] font-medium text-gray-400'>Quick:</span>
                  <div className='flex items-center gap-1'>
                    <button
                      type='button'
                      onClick={() => handleDeltaMinutes(-15)}
                      className='px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors shadow-2xs'
                      title='Subtract 15 minutes'>
                      -15m
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDeltaMinutes(15)}
                      className='px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors shadow-2xs'
                      title='Add 15 minutes'>
                      +15m
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Row */}
              <div className='pt-2.5 border-t border-gray-200/80 flex items-center justify-between gap-2'>
                <div>
                  <span className='text-xs font-semibold text-gray-800'>Final Amount:</span>
                  {isCustomPrice && (
                    <button
                      type='button'
                      onClick={handleResetToAutoPrice}
                      className='ml-2 text-[11px] text-blue-600 hover:text-blue-800 font-medium underline transition-colors'>
                      Reset to auto
                    </button>
                  )}
                </div>
                <div className='relative w-28'>
                  <span className='absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-500 font-semibold text-sm'>
                    $
                  </span>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={completePrice}
                    onChange={(e) => {
                      setCompletePrice(e.target.value);
                      setIsCustomPrice(true);
                    }}
                    className='w-full pl-6 pr-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-right font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className='space-y-2.5'>
              <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Payment Method
              </label>

              <div className='grid grid-cols-1 gap-2'>
                {/* Bank Transfer Option */}
                <div
                  onClick={() => setSelectedPaymentMethod("BANK_TRANSFER")}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    selectedPaymentMethod === "BANK_TRANSFER"
                      ? "border-blue-600 bg-blue-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}>
                  <input
                    type='radio'
                    name='paymentMethodChoice'
                    value='BANK_TRANSFER'
                    checked={selectedPaymentMethod === "BANK_TRANSFER"}
                    onChange={() => setSelectedPaymentMethod("BANK_TRANSFER")}
                    className='mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-sm'>🏦</span>
                      <span className='font-bold text-xs sm:text-sm text-gray-900'>Bank Transfer</span>
                    </div>
                    <p className='text-[11px] text-gray-500 mt-0.5 leading-tight'>
                      Generates a tax invoice for the client.
                    </p>
                  </div>
                </div>

                {/* Cash Option */}
                <div
                  onClick={() => setSelectedPaymentMethod("CASH")}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    selectedPaymentMethod === "CASH"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}>
                  <input
                    type='radio'
                    name='paymentMethodChoice'
                    value='CASH'
                    checked={selectedPaymentMethod === "CASH"}
                    onChange={() => setSelectedPaymentMethod("CASH")}
                    className='mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <span className='text-sm'>💵</span>
                      <span className='font-bold text-xs sm:text-sm text-gray-900'>Cash Payment</span>
                    </div>
                    <p className='text-[11px] text-gray-500 mt-0.5 leading-tight'>
                      Paid on site in cash. No invoice generated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Summary / Cash Preview Notice */}
            {selectedPaymentMethod === "CASH" ? (
              <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-left'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-emerald-800 flex items-center gap-1.5'>
                    <span>💵</span> Cash to Collect On Site:
                  </span>
                  <span className='text-base font-black text-emerald-900'>
                    ${parseFloat(completePrice || "0").toFixed(2)} AUD
                  </span>
                </div>
                <p className='text-[11px] text-emerald-700 leading-tight'>
                  Calculated for {formatDuration(durationHours * 60 + durationMinutes)} @ ${hourlyRate.toFixed(2)}/hr.
                </p>
              </div>
            ) : (
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-left'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-blue-800 flex items-center gap-1.5'>
                    <span>🏦</span> Invoice Amount:
                  </span>
                  <span className='text-base font-black text-blue-900'>
                    ${parseFloat(completePrice || "0").toFixed(2)} AUD
                  </span>
                </div>
                <p className='text-[11px] text-blue-700 leading-tight'>
                  Tax invoice reflecting {formatDuration(durationHours * 60 + durationMinutes)} @ ${hourlyRate.toFixed(2)}/hr will be created.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100'>
              <button
                type='button'
                disabled={loadingStatus !== null}
                onClick={() => setIsCompleteModalOpen(false)}
                className='px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50'>
                Cancel
              </button>
              <button
                type='button'
                onClick={handleConfirmComplete}
                disabled={loadingStatus !== null}
                className='px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed'>
                {loadingStatus === "COMPLETED" ? (
                  <>
                    <span className='w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Completing...</span>
                  </>
                ) : (
                  "Confirm & Complete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
