"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppointmentActions from "./AppointmentActions";

export interface SerializedAppointment {
  id: string;
  clientId: string;
  date: string;
  price: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  client: {
    id: string;
    name: string;
    address: string | null;
  };
}

interface ScheduleViewProps {
  appointments: SerializedAppointment[];
  currentTab: "upcoming" | "history";
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

export default function ScheduleView({
  appointments,
  currentTab,
  currentPage,
  totalItems,
  totalPages,
  pageSize,
}: ScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<"upcoming" | "history" | null>(null);
  const [pendingPage, setPendingPage] = useState<number | null>(null);


  const activeTab = isPending && pendingTab ? pendingTab : currentTab;
  const isHistory = activeTab === "history";

  const handleTabChange = (newTab: "upcoming" | "history") => {
    if (newTab === currentTab && !isPending) return;
    setPendingTab(newTab);
    setPendingPage(1);
    startTransition(() => {
      router.push(`/schedule?tab=${newTab}&page=1`);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages || isPending) return;
    setPendingPage(newPage);
    startTransition(() => {
      router.push(`/schedule?tab=${currentTab}&page=${newPage}`);
    });
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className='space-y-6'>
      {/* Tabs Switcher */}
      <div className='flex border-b border-gray-200' role='tablist' aria-label='Schedule views'>
        <button
          type='button'
          role='tab'
          aria-selected={!isHistory}
          disabled={isPending && pendingTab === "upcoming"}
          onClick={() => handleTabChange("upcoming")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            !isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          <span>Upcoming Cleanings</span>
          {isPending && pendingTab === "upcoming" && (
            <span
              data-testid='tab-spinner-upcoming'
              className='w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'
              aria-label='Loading upcoming cleanings'
            />
          )}
        </button>

        <button
          type='button'
          role='tab'
          aria-selected={isHistory}
          disabled={isPending && pendingTab === "history"}
          onClick={() => handleTabChange("history")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isHistory
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}>
          <span>History & Past Jobs</span>
          {isPending && pendingTab === "history" && (
            <span
              data-testid='tab-spinner-history'
              className='w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'
              aria-label='Loading history & past jobs'
            />
          )}
        </button>
      </div>

      {/* Content Area */}
      {isPending ? (
        /* Loading Skeleton while switching tabs or pages */
        <div data-testid='schedule-loading-skeleton' className='space-y-4'>
          <div className='flex items-center justify-center py-2 gap-2 text-xs font-medium text-blue-600 bg-blue-50/60 rounded-xl border border-blue-100'>
            <span className='w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span>
              {pendingTab === "history"
                ? "Loading history & past jobs..."
                : pendingTab === "upcoming"
                  ? "Loading upcoming cleanings..."
                  : `Loading page ${pendingPage}...`}
            </span>
          </div>

          <div className='space-y-3 animate-pulse'>
            {[...Array(Math.min(pageSize, 8))].map((_, i) => (
              <div
                key={i}
                className='bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs'>
                <div className='space-y-2 min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <div className='h-5 w-40 bg-gray-200 rounded' />
                    <div className='h-5 w-20 bg-gray-100 rounded-full' />
                  </div>
                  <div className='h-3.5 w-52 bg-gray-100 rounded' />
                  <div className='h-3 w-36 bg-gray-100 rounded' />
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                  <div className='h-5 w-16 bg-gray-200 rounded' />
                  <div className='h-8 w-24 bg-gray-100 rounded-lg' />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : appointments.length === 0 ? (
        /* Empty State */
        <div className='bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center'>
          <span className='text-3xl block mb-2'>{isHistory ? "📁" : "📋"}</span>
          <p className='text-gray-800 font-semibold text-sm sm:text-base mb-1'>
            {isHistory ? "No past appointments found" : "No upcoming cleanings scheduled"}
          </p>
          <p className='text-xs sm:text-sm text-gray-400 mb-5 max-w-sm mx-auto'>
            {isHistory
              ? "Completed and cancelled cleanings will appear here."
              : "Create an appointment to start organizing your calendar."}
          </p>
          {!isHistory && (
            <Link
              href='/schedule/new'
              className='inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs'>
              <span>＋</span>
              <span>Schedule Cleaning</span>
            </Link>
          )}
        </div>
      ) : (
        /* Appointments List */
        <div className='space-y-4'>
          <div className='space-y-3'>
            {appointments.map((apt) => {
              const dateObj = new Date(apt.date);
              const formattedDate = dateObj.toLocaleDateString("en-AU", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
              });

              const isCompleted = apt.status === "COMPLETED";

              return (
                <div
                  key={apt.id}
                  className={`border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isHistory
                      ? "bg-white/80 border-gray-200 opacity-90"
                      : "bg-white border-gray-200 shadow-xs hover:shadow-sm hover:border-gray-300"
                  }`}>
                  <div className='space-y-1.5 min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Link
                        href={`/clients/${apt.client.id}`}
                        className='font-bold text-sm sm:text-base text-gray-900 hover:text-blue-600 hover:underline truncate'>
                        {apt.client.name}
                      </Link>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          apt.status === "SCHEDULED"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                        {apt.status}
                      </span>
                    </div>

                    <p className='text-xs text-gray-500'>
                      {formattedDate} at <strong className='text-gray-700 font-semibold'>{formattedTime}</strong>
                    </p>

                    {apt.client.address && <p className='text-xs text-gray-400 truncate'>{apt.client.address}</p>}
                  </div>

                  <div className='flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                    <span
                      className={`text-base font-bold ${isHistory ? "text-gray-600 font-medium" : "text-gray-900"}`}>
                      ${apt.price.toFixed(2)}
                    </span>
                    <AppointmentActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      clientName={apt.client.name}
                      initialDate={apt.date}
                      initialPrice={apt.price}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200'>
              <p className='text-xs sm:text-sm text-gray-500 order-2 sm:order-1'>
                Showing <strong className='font-semibold text-gray-800'>{startItem}</strong> to{" "}
                <strong className='font-semibold text-gray-800'>{endItem}</strong> of{" "}
                <strong className='font-semibold text-gray-800'>{totalItems}</strong> cleanings
              </p>

              {totalPages > 1 && (
                <div className='flex items-center gap-1.5 order-1 sm:order-2'>
                  <button
                    type='button'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isPending}
                    aria-label='Previous page'
                    className='px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all'>
                    ← Previous
                  </button>

                  <div className='flex items-center gap-1'>
                    {getPageNumbers().map((pageItem, index) => {
                      if (typeof pageItem === "string") {
                        return (
                          <span key={`ellipsis-${index}`} className='px-2 text-xs text-gray-400'>
                            ...
                          </span>
                        );
                      }

                      const isActive = pageItem === currentPage;
                      return (
                        <button
                          key={pageItem}
                          type='button'
                          onClick={() => handlePageChange(pageItem)}
                          disabled={isPending}
                          aria-label={`Page ${pageItem}`}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}>
                          {pageItem}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type='button'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isPending}
                    aria-label='Next page'
                    className='px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all'>
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
