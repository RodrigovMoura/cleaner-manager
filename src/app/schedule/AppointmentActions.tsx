"use client";

import { useState, useEffect } from "react";
import { updateAppointmentStatus, updateAppointment } from "@/actions/appointment";
import { formatToDateTimeLocal } from "@/lib/date";

interface AppointmentActionsProps {
  appointmentId: string;
  currentStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  clientName?: string;
  initialDate?: string | Date;
  initialPrice?: number;
}

export default function AppointmentActions({
  appointmentId,
  currentStatus,
  clientName,
  initialDate,
  initialPrice,
}: AppointmentActionsProps) {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState(() => (initialDate ? formatToDateTimeLocal(initialDate) : ""));
  const [editPrice, setEditPrice] = useState(() =>
    initialPrice !== undefined && initialPrice !== null ? Number(initialPrice).toFixed(2) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleStatusChange = async (newStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED") => {
    setLoadingStatus(newStatus);
    await updateAppointmentStatus(appointmentId, newStatus);
    setLoadingStatus(null);
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
      if (e.key === "Escape" && isEditModalOpen && !isSaving) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen, isSaving]);

  return (
    <>
      {currentStatus === "SCHEDULED" ? (
        <div className='flex items-center gap-1.5 flex-wrap sm:flex-nowrap'>
          <button
            onClick={() => handleStatusChange("COMPLETED")}
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
        <div className='flex items-center gap-1.5'>
          <button
            onClick={() => handleStatusChange("SCHEDULED")}
            disabled={loadingStatus !== null || isSaving}
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
            disabled={loadingStatus !== null || isSaving}
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
    </>
  );
}
