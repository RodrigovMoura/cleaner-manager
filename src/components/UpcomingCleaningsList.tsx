"use client";

import { useState } from "react";
import Link from "next/link";
import ClientContactActions from "./ClientContactActions";
import { formatInTimezone, formatTimeInTimezone } from "@/lib/timezone";

export interface UpcomingCleaningItem {
  id: string;
  date: string | Date;
  price: number;
  client: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
}

interface UpcomingCleaningsListProps {
  appointments: UpcomingCleaningItem[];
  timeZone: string;
  pageSize?: number;
}

export default function UpcomingCleaningsList({
  appointments,
  timeZone,
  pageSize = 6,
}: UpcomingCleaningsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (appointments.length === 0) {
    return (
      <div className='bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs sm:text-sm text-gray-500'>
        No further cleanings scheduled this week.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * pageSize;
  const currentItems = appointments.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className='space-y-3'>
      <div className='space-y-2.5'>
        {currentItems.map((apt) => {
          const aptDate = new Date(apt.date);
          const formattedDate = formatInTimezone(aptDate, timeZone, {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          const formattedTime = formatTimeInTimezone(aptDate, timeZone);

          return (
            <div
              key={apt.id}
              className='p-3.5 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition-all'>
              <div className='space-y-1 min-w-0 flex-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <Link
                    href={`/clients/${apt.client.id}`}
                    className='font-bold text-sm text-gray-900 hover:text-blue-600 hover:underline truncate'>
                    {apt.client.name}
                  </Link>
                  <span className='text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100/60'>
                    {formattedDate} • {formattedTime}
                  </span>
                </div>
                {apt.client.address && <p className='text-xs text-gray-500 truncate'>📍 {apt.client.address}</p>}
              </div>

              <div className='flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                <span className='text-sm font-bold text-gray-900'>${Number(apt.price).toFixed(2)}</span>
                {apt.client.phone && (
                  <ClientContactActions phone={apt.client.phone} clientName={apt.client.name} compact />
                )}
                <Link
                  href={`/schedule/${apt.id}/edit`}
                  className='px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors'>
                  Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between gap-2 pt-2 px-1 text-xs text-gray-500'>
          <span>
            Page <strong className='font-semibold text-gray-800'>{activePage}</strong> of{" "}
            <strong className='font-semibold text-gray-800'>{totalPages}</strong> ({appointments.length} jobs)
          </span>

          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              onClick={handlePrev}
              disabled={activePage <= 1}
              className='px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs'>
              ← Prev
            </button>
            <button
              type='button'
              onClick={handleNext}
              disabled={activePage >= totalPages}
              className='px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs'>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
