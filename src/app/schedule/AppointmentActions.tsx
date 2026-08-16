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
          className='px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50'>
          {loadingStatus === "COMPLETED" ? "Completing..." : "Mark as Completed"}
        </button>
        <button
          onClick={() => handleStatusChange("CANCELLED")}
          disabled={loadingStatus !== null}
          className='px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50'>
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
        className='px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors disabled:opacity-50'>
        {loadingStatus === "SCHEDULED" ? "Updating..." : "Reopen"}
      </button>
    </div>
  );
}
