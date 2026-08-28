"use client";

import { useState } from "react";
import { updateAppointmentStatus } from "@/actions/appointment";

interface AppointmentActionsProps {
  appointmentId: string;
  currentStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export default function AppointmentActions({ appointmentId, currentStatus }: AppointmentActionsProps) {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED") => {
    setLoadingStatus(newStatus);
    await updateAppointmentStatus(appointmentId, newStatus);
    setLoadingStatus(null);
  };

  if (currentStatus === "SCHEDULED") {
    return (
      <div className='flex items-center gap-2'>
        <button
          onClick={() => handleStatusChange("COMPLETED")}
          disabled={loadingStatus !== null}
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
          onClick={() => handleStatusChange("CANCELLED")}
          disabled={loadingStatus !== null}
          className='px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50'>
          {loadingStatus === "CANCELLED" ? "..." : "Cancel"}
        </button>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={() => handleStatusChange("SCHEDULED")}
        disabled={loadingStatus !== null}
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
    </div>
  );
}
