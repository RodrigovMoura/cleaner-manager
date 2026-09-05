"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { startOfWeek, addDays, isSameDay, isSameMonth, getMonthGrid } from "@/lib/date";

export interface CalendarAppointment {
  id: string;
  date: string;
  price: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  clientId: string;
  client: {
    id: string;
    name: string;
    phone: string;
    address: string;
    email: string | null;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    amount: number;
  } | null;
}

interface CalendarViewProps {
  appointments: CalendarAppointment[];
}

type CalendarViewMode = "day" | "week" | "2weeks" | "month";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({ appointments }: CalendarViewProps) {
  const [view, setView] = useState<CalendarViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedAppointment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pre-index appointments by local YYYY-MM-DD
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const apt of appointments) {
      const d = new Date(apt.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
        2,
        "0",
      )}`;
      const list = map.get(key) || [];
      list.push(apt);
      map.set(key, list);
    }

    // Sort cleanings by time inside each day
    for (const [, list] of map.entries()) {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return map;
  }, [appointments]);

  const getDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Calculate visible days array based on active view mode
  const visibleDays = useMemo(() => {
    if (view === "day") {
      return [new Date(currentDate)];
    }
    if (view === "week") {
      const start = startOfWeek(currentDate, 1);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    if (view === "2weeks") {
      const start = startOfWeek(currentDate, 1);
      return Array.from({ length: 14 }, (_, i) => addDays(start, i));
    }
    // month view
    return getMonthGrid(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [view, currentDate]);

  // Demand & workload summary for currently visible days
  const visibleDemand = useMemo(() => {
    const visibleKeys = new Set(visibleDays.map(getDayKey));
    const matching: CalendarAppointment[] = [];

    for (const key of visibleKeys) {
      const dayApts = appointmentsByDay.get(key);
      if (dayApts) {
        matching.push(...dayApts);
      }
    }

    const scheduled = matching.filter((a) => a.status === "SCHEDULED");
    const completed = matching.filter((a) => a.status === "COMPLETED");
    const totalEarnings = matching.filter((a) => a.status !== "CANCELLED").reduce((sum, a) => sum + a.price, 0);

    return {
      totalCount: matching.length,
      scheduledCount: scheduled.length,
      completedCount: completed.length,
      totalEarnings,
    };
  }, [visibleDays, appointmentsByDay]);

  // Navigate periods
  const handlePrev = () => {
    if (view === "day") setCurrentDate((d) => addDays(d, -1));
    else if (view === "week") setCurrentDate((d) => addDays(d, -7));
    else if (view === "2weeks") setCurrentDate((d) => addDays(d, -14));
    else setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (view === "day") setCurrentDate((d) => addDays(d, 1));
    else if (view === "week") setCurrentDate((d) => addDays(d, 7));
    else if (view === "2weeks") setCurrentDate((d) => addDays(d, 14));
    else setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header title formatting
  const periodTitle = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week" || view === "2weeks") {
      const start = visibleDays[0];
      const end = visibleDays[visibleDays.length - 1];
      const startStr = start.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
      const endStr = end.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${startStr} – ${endStr}`;
    }
    // month
    return currentDate.toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  }, [view, currentDate, visibleDays]);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  };

  const today = new Date();

  return (
    <div className='space-y-5'>
      {/* Top Header & Calendar Controls Bar */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div>
          <div className='flex items-center gap-2.5'>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2'>
              <span>📅</span>
              <span>Calendar</span>
            </h1>
          </div>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>
            Visual demand forecast and workload schedule across days, weeks, and fortnights.
          </p>
        </div>

        {/* View mode switcher */}
        <div className='flex items-center gap-2 flex-wrap sm:flex-nowrap'>
          <div className='bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 text-xs font-semibold'>
            <button
              type='button'
              onClick={() => setView("day")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                view === "day" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}>
              Day
            </button>
            <button
              type='button'
              onClick={() => setView("week")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                view === "week" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}>
              Week
            </button>
            <button
              type='button'
              onClick={() => setView("2weeks")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                view === "2weeks" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}>
              2 Weeks
            </button>
            <button
              type='button'
              onClick={() => setView("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                view === "month" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}>
              Month
            </button>
          </div>

          <Link
            href='/schedule/new'
            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs shrink-0'>
            <span>＋</span>
            <span>Schedule</span>
          </Link>
        </div>
      </div>

      {/* Period Navigation and Demand Summary Strip */}
      <div className='bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        {/* Navigation buttons and Title */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={handleToday}
              className='px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-200'>
              Today
            </button>
            <button
              type='button'
              onClick={handlePrev}
              aria-label='Previous period'
              className='p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors'>
              ◀
            </button>
            <button
              type='button'
              onClick={handleNext}
              aria-label='Next period'
              className='p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors'>
              ▶
            </button>
          </div>
          <h2 className='text-base sm:text-lg font-bold text-gray-900 tracking-tight'>{periodTitle}</h2>
        </div>

        {/* Workload / Demand Indicators */}
        <div className='flex items-center gap-3 text-xs flex-wrap'>
          <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-semibold'>
            <span>🧹</span>
            <span>{visibleDemand.totalCount} cleanings</span>
          </div>
          <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold'>
            <span>💰</span>
            <span>${visibleDemand.totalEarnings.toFixed(2)} AUD</span>
          </div>
          <div className='text-gray-400 text-[11px] hidden lg:inline'>
            ({visibleDemand.scheduledCount} scheduled, {visibleDemand.completedCount} completed)
          </div>
        </div>
      </div>

      {/* Main Calendar Display */}
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
        {/* VIEW 1: MONTH VIEW */}
        {view === "month" && (
          <div>
            {/* Weekday column headers */}
            <div className='grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-bold text-gray-600 py-2.5'>
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Grid of days */}
            <div className='grid grid-cols-7 divide-x divide-y divide-gray-100'>
              {visibleDays.map((day, idx) => {
                const dayKey = getDayKey(day);
                const dayApts = appointmentsByDay.get(dayKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={idx}
                    className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                      isCurrentMonth ? "bg-white hover:bg-gray-50/50" : "bg-gray-50/60 text-gray-400"
                    }`}>
                    {/* Day number & count header */}
                    <div className='flex items-center justify-between'>
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-blue-600 text-white shadow-xs"
                            : isCurrentMonth
                              ? "text-gray-800"
                              : "text-gray-400"
                        }`}>
                        {day.getDate()}
                      </span>

                      {dayApts.length > 0 && (
                        <span className='text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded'>
                          {dayApts.length}
                        </span>
                      )}
                    </div>

                    {/* Cleanings list */}
                    <div className='space-y-1 my-1 flex-1 overflow-hidden'>
                      {dayApts.slice(0, 3).map((apt) => {
                        const isCompleted = apt.status === "COMPLETED";
                        const isCancelled = apt.status === "CANCELLED";

                        return (
                          <button
                            key={apt.id}
                            type='button'
                            onClick={() => setSelectedAppointment(apt)}
                            title={`${formatTime(apt.date)} - ${apt.client.name} ($${apt.price})`}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : isCancelled
                                  ? "bg-gray-100 text-gray-400 line-through"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                            <span className='font-bold shrink-0'>{formatTime(apt.date)}</span>
                            <span className='truncate'>{apt.client.name}</span>
                          </button>
                        );
                      })}

                      {dayApts.length > 3 && (
                        <button
                          type='button'
                          onClick={() => {
                            setCurrentDate(day);
                            setView("day");
                          }}
                          className='text-[10px] font-semibold text-gray-500 hover:text-blue-600 hover:underline block text-left pl-1'>
                          +{dayApts.length - 3} more...
                        </button>
                      )}
                    </div>

                    {/* Quick add prompt on hover */}
                    <div className='pt-1 text-right'>
                      <Link
                        href={`/schedule/new?date=${dayKey}`}
                        className='text-[10px] text-gray-300 hover:text-blue-600 font-bold transition-colors'
                        title={`Schedule cleaning on ${day.toLocaleDateString("en-AU")}`}>
                        ＋
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: TWO WEEKS (FORTNIGHTLY) VIEW */}
        {view === "2weeks" && (
          <div>
            <div className='grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-bold text-gray-600 py-2.5'>
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className='grid grid-cols-7 divide-x divide-y divide-gray-100'>
              {visibleDays.map((day, idx) => {
                const dayKey = getDayKey(day);
                const dayApts = appointmentsByDay.get(dayKey) || [];
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={idx}
                    className='min-h-[160px] sm:min-h-[190px] p-2 flex flex-col justify-between bg-white hover:bg-gray-50/40 transition-colors'>
                    {/* Header */}
                    <div className='flex items-center justify-between pb-1 border-b border-gray-100'>
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-blue-600 text-white shadow-xs" : "text-gray-900"
                        }`}>
                        {day.getDate()}
                      </span>
                      {dayApts.length > 0 && (
                        <span className='text-[10px] font-bold text-gray-500'>
                          ${dayApts.reduce((sum, a) => sum + a.price, 0).toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* List */}
                    <div className='space-y-1.5 my-2 flex-1 overflow-y-auto max-h-[140px]'>
                      {dayApts.map((apt) => (
                        <button
                          key={apt.id}
                          type='button'
                          onClick={() => setSelectedAppointment(apt)}
                          className={`w-full text-left p-1.5 rounded-lg border text-xs transition-all hover:shadow-2xs ${
                            apt.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : apt.status === "CANCELLED"
                                ? "bg-gray-50 text-gray-400 line-through border-gray-200"
                                : "bg-blue-50 text-blue-900 border-blue-200"
                          }`}>
                          <div className='font-bold flex items-center justify-between'>
                            <span>{formatTime(apt.date)}</span>
                            <span>${apt.price.toFixed(0)}</span>
                          </div>
                          <div className='font-semibold truncate text-[11px]'>{apt.client.name}</div>
                        </button>
                      ))}
                    </div>

                    <div className='text-right'>
                      <Link
                        href={`/schedule/new?date=${dayKey}`}
                        className='text-[11px] font-semibold text-gray-400 hover:text-blue-600 transition-colors'>
                        ＋ Schedule
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: WEEK VIEW (7 DAYS) */}
        {view === "week" && (
          <div className='overflow-x-auto'>
            <div className='min-w-[700px] grid grid-cols-7 divide-x divide-gray-200'>
              {visibleDays.map((day, idx) => {
                const dayKey = getDayKey(day);
                const dayApts = appointmentsByDay.get(dayKey) || [];
                const isToday = isSameDay(day, today);
                const totalDayRev = dayApts
                  .filter((a) => a.status !== "CANCELLED")
                  .reduce((acc, a) => acc + a.price, 0);

                return (
                  <div key={idx} className='flex flex-col min-h-[380px] bg-white'>
                    {/* Day Column Header */}
                    <div
                      className={`p-3 text-center border-b border-gray-200 ${
                        isToday ? "bg-blue-50/70" : "bg-gray-50/70"
                      }`}>
                      <div className='text-xs font-semibold text-gray-500 uppercase'>{WEEKDAYS[idx]}</div>
                      <div
                        className={`text-lg font-bold inline-block px-2 py-0.5 rounded-full ${
                          isToday ? "bg-blue-600 text-white mt-1" : "text-gray-900"
                        }`}>
                        {day.getDate()}
                      </div>
                      <div className='text-[10px] text-gray-500 font-semibold mt-1'>
                        {dayApts.length} jobs • ${totalDayRev.toFixed(0)}
                      </div>
                    </div>

                    {/* Column Body: Appointments */}
                    <div className='p-2 space-y-2 flex-1 overflow-y-auto'>
                      {dayApts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs ${
                            apt.status === "COMPLETED"
                              ? "bg-emerald-50/70 text-emerald-950 border-emerald-200"
                              : apt.status === "CANCELLED"
                                ? "bg-gray-50 text-gray-400 border-gray-200"
                                : "bg-blue-50/70 text-blue-950 border-blue-200"
                          }`}>
                          <div className='flex items-center justify-between font-bold text-[11px] mb-1'>
                            <span className='text-blue-700'>{formatTime(apt.date)}</span>
                            <span>${apt.price.toFixed(2)}</span>
                          </div>
                          <div className='font-bold text-gray-900 truncate'>{apt.client.name}</div>
                          {apt.client.address && (
                            <div className='text-[10px] text-gray-500 truncate mt-0.5'>📍 {apt.client.address}</div>
                          )}
                          <div className='mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[10px]'>
                            <span
                              className={`font-semibold ${
                                apt.status === "COMPLETED"
                                  ? "text-emerald-700"
                                  : apt.status === "CANCELLED"
                                    ? "text-gray-400"
                                    : "text-blue-600"
                              }`}>
                              {apt.status}
                            </span>
                            {apt.invoice && (
                              <span className='text-gray-400 font-mono'>{apt.invoice.invoiceNumber}</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {dayApts.length === 0 && (
                        <div className='h-full flex items-center justify-center p-4 text-center'>
                          <span className='text-xs text-gray-300'>No cleanings</span>
                        </div>
                      )}
                    </div>

                    {/* Column Footer */}
                    <div className='p-2 border-t border-gray-100 text-center bg-gray-50/30'>
                      <Link
                        href={`/schedule/new?date=${dayKey}`}
                        className='text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors'>
                        ＋ Add Job
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: DAY VIEW (1 DAY DETAIL) */}
        {view === "day" && (
          <div className='p-4 sm:p-6 space-y-4'>
            {/* Daily summary header */}
            {(() => {
              const dayKey = getDayKey(currentDate);
              const dayApts = appointmentsByDay.get(dayKey) || [];
              const totalAmount = dayApts.filter((a) => a.status !== "CANCELLED").reduce((sum, a) => sum + a.price, 0);

              return (
                <div>
                  <div className='bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6'>
                    <div>
                      <h3 className='text-sm font-bold text-blue-950'>
                        {currentDate.toLocaleDateString("en-AU", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <p className='text-xs text-blue-700 mt-0.5'>
                        {dayApts.length} total appointments scheduled for this date.
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm font-bold text-blue-900'>Total: ${totalAmount.toFixed(2)} AUD</span>
                      <Link
                        href={`/schedule/new?date=${dayKey}`}
                        className='px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors'>
                        ＋ Schedule Clean
                      </Link>
                    </div>
                  </div>

                  {dayApts.length === 0 ? (
                    <div className='text-center py-12 text-gray-400'>
                      <span className='text-3xl block mb-2'>☕</span>
                      <p className='text-sm font-semibold text-gray-600'>No cleanings scheduled for this day</p>
                      <p className='text-xs text-gray-400 mt-1 mb-4'>
                        Take a well-deserved rest or add a new appointment.
                      </p>
                      <Link
                        href={`/schedule/new?date=${dayKey}`}
                        className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors'>
                        <span>＋ Schedule Cleaning</span>
                      </Link>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {dayApts.map((apt) => (
                        <div
                          key={apt.id}
                          className='bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                          <div className='space-y-1.5 flex-1'>
                            <div className='flex items-center gap-2.5'>
                              <span className='px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200'>
                                {formatTime(apt.date)}
                              </span>
                              <Link
                                href={`/clients/${apt.clientId}`}
                                className='font-bold text-gray-900 hover:text-blue-600 transition-colors text-base'>
                                {apt.client.name}
                              </Link>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  apt.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : apt.status === "CANCELLED"
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                {apt.status}
                              </span>
                            </div>

                            <div className='text-xs text-gray-500 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4'>
                              {apt.client.address && (
                                <span className='flex items-center gap-1'>
                                  <span>📍</span>
                                  <span>{apt.client.address}</span>
                                </span>
                              )}
                              {apt.client.phone && (
                                <span className='flex items-center gap-1'>
                                  <span>📞</span>
                                  <a href={`tel:${apt.client.phone}`} className='hover:text-blue-600 hover:underline'>
                                    {apt.client.phone}
                                  </a>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0'>
                            <div className='text-right'>
                              <div className='text-sm font-bold text-gray-900'>${apt.price.toFixed(2)}</div>
                              <div className='text-[10px] text-gray-400'>
                                {apt.invoice ? apt.invoice.invoiceNumber : "No invoice yet"}
                              </div>
                            </div>

                            <div className='flex items-center gap-1.5'>
                              <Link
                                href={`/schedule/${apt.id}/edit`}
                                className='px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'>
                                Edit
                              </Link>
                              <button
                                type='button'
                                onClick={() => setSelectedAppointment(apt)}
                                className='px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors'>
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150'
          role='dialog'
          aria-modal='true'>
          <div className='bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200'>
            {/* Modal Header */}
            <div className='flex items-start justify-between gap-3 border-b border-gray-100 pb-3'>
              <div>
                <span className='text-[10px] font-bold text-blue-600 uppercase tracking-wider'>
                  Appointment Details
                </span>
                <h3 className='text-lg font-bold text-gray-900'>{selectedAppointment.client.name}</h3>
              </div>
              <button
                type='button'
                onClick={() => setSelectedAppointment(null)}
                className='text-gray-400 hover:text-gray-600 text-sm font-bold p-1'>
                ✕
              </button>
            </div>

            {/* Modal Info List */}
            <div className='space-y-3 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Date & Time:</span>
                <span className='font-bold text-gray-900'>
                  {new Date(selectedAppointment.date).toLocaleDateString("en-AU", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at {formatTime(selectedAppointment.date)}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedAppointment.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : selectedAppointment.status === "CANCELLED"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                  {selectedAppointment.status}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Price:</span>
                <span className='font-bold text-gray-900 text-sm'>${selectedAppointment.price.toFixed(2)} AUD</span>
              </div>

              {selectedAppointment.client.address && (
                <div className='flex items-start justify-between gap-2 pt-1 border-t border-gray-100'>
                  <span className='text-gray-500 shrink-0'>Address:</span>
                  <span className='text-gray-800 text-right font-medium'>{selectedAppointment.client.address}</span>
                </div>
              )}

              {selectedAppointment.client.phone && (
                <div className='flex items-center justify-between pt-1 border-t border-gray-100'>
                  <span className='text-gray-500'>Phone:</span>
                  <a
                    href={`tel:${selectedAppointment.client.phone}`}
                    className='font-bold text-blue-600 hover:underline'>
                    {selectedAppointment.client.phone}
                  </a>
                </div>
              )}

              <div className='flex items-center justify-between pt-1 border-t border-gray-100'>
                <span className='text-gray-500'>Invoice:</span>
                <span className='font-mono font-medium text-gray-700'>
                  {selectedAppointment.invoice
                    ? `${selectedAppointment.invoice.invoiceNumber} (${selectedAppointment.invoice.status})`
                    : "Not generated"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className='flex items-center justify-end gap-2 pt-3 border-t border-gray-100'>
              <Link
                href={`/clients/${selectedAppointment.clientId}`}
                className='px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'>
                View Client Profile
              </Link>
              <Link
                href={`/schedule/${selectedAppointment.id}/edit`}
                className='px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors'>
                Edit Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
