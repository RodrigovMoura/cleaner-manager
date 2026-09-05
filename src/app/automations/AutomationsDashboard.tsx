"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  AutomationField,
  updateClientAutomationRule,
  pauseAllAutoSendInvoices,
} from "@/actions/automation";

export interface AutomationClient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  enableAppointmentReminder: boolean;
  reminderDaysBefore: number;
  enableInvoice: boolean;
  autoSendInvoice: boolean;
  enablePaymentReminder: boolean;
  _count?: {
    appointments: number;
    invoices: number;
  };
}

interface AutomationsDashboardProps {
  initialClients: AutomationClient[];
}

type FilterType = "all" | "autoSend" | "reminders" | "missingEmail";

export default function AutomationsDashboard({ initialClients }: AutomationsDashboardProps) {
  const [clients, setClients] = useState<AutomationClient[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Safety Pause modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isPausingAll, setIsPausingAll] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Counts for filters and safety banner
  const autoSendActiveCount = useMemo(
    () => clients.filter((c) => c.autoSendInvoice).length,
    [clients]
  );
  const missingEmailCount = useMemo(
    () => clients.filter((c) => !c.email || c.email.trim().length === 0).length,
    [clients]
  );
  const remindersActiveCount = useMemo(
    () => clients.filter((c) => c.enableAppointmentReminder || c.enablePaymentReminder).length,
    [clients]
  );

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Text search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesEmail = client.email?.toLowerCase().includes(query) ?? false;
        const matchesPhone = client.phone.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // Quick filter
      if (activeFilter === "autoSend") {
        return client.autoSendInvoice;
      }
      if (activeFilter === "missingEmail") {
        return !client.email || client.email.trim().length === 0;
      }
      if (activeFilter === "reminders") {
        return client.enableAppointmentReminder || client.enablePaymentReminder;
      }
      return true;
    });
  }, [clients, searchQuery, activeFilter]);

  // Handle individual toggle change
  const handleToggle = async (
    clientId: string,
    field: AutomationField,
    newValue: boolean | number
  ) => {
    const previousClients = [...clients];
    const opKey = `${clientId}-${field}`;
    setPendingKey(opKey);

    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const updated = { ...c, [field]: newValue };

        // Safeguard: if invoice creation is turned off, also turn off autoSendInvoice
        if (field === "enableInvoice" && newValue === false) {
          updated.autoSendInvoice = false;
        }

        return updated;
      })
    );

    startTransition(async () => {
      try {
        const res = await updateClientAutomationRule(clientId, field, newValue);
        if (!res.success) {
          // Revert optimistic update
          setClients(previousClients);
          showToast(res.message, "error");
        } else {
          showToast(res.message, "success");
        }
      } catch (err) {
        console.error("Failed to update automation rule:", err);
        setClients(previousClients);
        showToast("Connection error: failed to update setting.", "error");
      } finally {
        setPendingKey(null);
      }
    });
  };

  // Handle emergency pause all
  const handlePauseAllAutoSend = async () => {
    setIsPausingAll(true);
    try {
      const res = await pauseAllAutoSendInvoices();
      if (res.success) {
        setClients((prev) => prev.map((c) => ({ ...c, autoSendInvoice: false })));
        showToast(res.message, "success");
        setShowPauseModal(false);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      console.error("Failed to pause all auto-send:", err);
      showToast("Error occurred while pausing automations.", "error");
    } finally {
      setIsPausingAll(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Toast Notification */}
      {toast && (
        <div className='fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300'>
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-800"
                : "bg-red-900 text-white border-red-800"
            }`}>
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.message}</span>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='ml-2 text-white/70 hover:text-white text-xs font-bold'>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Safety Alert & Bulk Actions Bar */}
      <div className='bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='text-2xl mt-0.5'>🛡️</span>
          <div>
            <h3 className='text-sm font-bold text-amber-950 flex items-center gap-2'>
              Email Safeguards & Dispatch Rules
              {autoSendActiveCount > 0 ? (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200/80 text-amber-900 border border-amber-300'>
                  {autoSendActiveCount} Auto-Send Active
                </span>
              ) : (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                  All Invoices Require Manual Review
                </span>
              )}
            </h3>
            <p className='text-xs text-amber-800/90 mt-1 leading-relaxed max-w-2xl'>
              Prevent accidental emails by reviewing which clients have automated dispatch enabled.
              Clients with &ldquo;Auto-Send&rdquo; will email PDF invoices immediately upon cleaning completion.
            </p>
          </div>
        </div>

        {autoSendActiveCount > 0 && (
          <button
            type='button'
            onClick={() => setShowPauseModal(true)}
            className='shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 active:bg-amber-200 border border-amber-300 rounded-xl transition-colors shadow-2xs'>
            <span>⏸️</span>
            <span>Pause All Auto-Send</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal for Safety Pause */}
      {showPauseModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150'
          role='dialog'
          aria-modal='true'>
          <div className='bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-200'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0'>
                ⏸️
              </div>
              <div>
                <h4 className='font-bold text-gray-900 text-base'>Pause All Auto-Send Invoices?</h4>
                <p className='text-xs text-gray-500'>Immediate safety pause</p>
              </div>
            </div>

            <p className='text-xs sm:text-sm text-gray-600 leading-relaxed'>
              This will disable automatic invoice dispatch for all <strong>{autoSendActiveCount} client(s)</strong> currently set to auto-send.
              Invoices will continue to be generated when cleanings are completed, but they will wait for your manual review before being emailed.
            </p>

            <div className='flex items-center justify-end gap-2.5 pt-2'>
              <button
                type='button'
                onClick={() => setShowPauseModal(false)}
                disabled={isPausingAll}
                className='px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={handlePauseAllAutoSend}
                disabled={isPausingAll}
                className='px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5'>
                {isPausingAll ? "Pausing..." : "Yes, Pause All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
        {/* Search Input */}
        <div className='relative flex-1 max-w-md'>
          <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm'>
            🔍
          </span>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search client by name, email or phone...'
            className='w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs'
          />
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery("")}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold'>
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
          <button
            type='button'
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              activeFilter === "all"
                ? "bg-gray-900 text-white font-semibold"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}>
            All ({clients.length})
          </button>
          <button
            type='button'
            onClick={() => setActiveFilter("autoSend")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === "autoSend"
                ? "bg-amber-600 text-white font-semibold"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}>
            <span>⚡ Auto-Send</span>
            <span className='text-[10px] opacity-90'>({autoSendActiveCount})</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveFilter("reminders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === "reminders"
                ? "bg-blue-600 text-white font-semibold"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}>
            <span>🔔 Reminders</span>
            <span className='text-[10px] opacity-90'>({remindersActiveCount})</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveFilter("missingEmail")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === "missingEmail"
                ? "bg-red-600 text-white font-semibold"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}>
            <span>⚠️ No Email</span>
            <span className='text-[10px] opacity-90'>({missingEmailCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredClients.length === 0 ? (
        <div className='bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center'>
          <span className='text-3xl block mb-2'>🔍</span>
          <p className='text-gray-800 font-semibold text-sm sm:text-base mb-1'>No clients found</p>
          <p className='text-xs text-gray-400 max-w-sm mx-auto mb-4'>
            {searchQuery || activeFilter !== "all"
              ? "No clients match your search query or selected filter."
              : "You do not have any clients configured yet."}
          </p>
          {(searchQuery || activeFilter !== "all") && (
            <button
              type='button'
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className='inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors'>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className='hidden md:block bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider'>
                    <th className='py-3.5 px-4 sm:px-6'>Client & Contact</th>
                    <th className='py-3.5 px-4'>
                      <div className='flex items-center gap-1'>
                        <span>Pre-Clean Reminder</span>
                        <span
                          className='cursor-help text-gray-400 hover:text-gray-600'
                          title='Automated email sent N days before scheduled cleaning via daily cron.'>
                          ⓘ
                        </span>
                      </div>
                    </th>
                    <th className='py-3.5 px-4'>
                      <div className='flex items-center gap-1'>
                        <span>Create Invoice</span>
                        <span
                          className='cursor-help text-gray-400 hover:text-gray-600'
                          title='Auto-creates invoice in PENDING status when cleaning is marked COMPLETED.'>
                          ⓘ
                        </span>
                      </div>
                    </th>
                    <th className='py-3.5 px-4'>
                      <div className='flex items-center gap-1 text-amber-700'>
                        <span>Auto-Send Invoice</span>
                        <span
                          className='cursor-help text-amber-600 hover:text-amber-800'
                          title='CRITICAL: Dispatches PDF invoice immediately upon marking cleaning completed without manual review.'>
                          ⚠️
                        </span>
                      </div>
                    </th>
                    <th className='py-3.5 px-4'>
                      <div className='flex items-center gap-1'>
                        <span>Overdue Chaser</span>
                        <span
                          className='cursor-help text-gray-400 hover:text-gray-600'
                          title='Sends overdue payment reminder email every 3 days if unpaid.'>
                          ⓘ
                        </span>
                      </div>
                    </th>
                    <th className='py-3.5 px-4 text-right'>Channel</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 text-xs sm:text-sm text-gray-700'>
                  {filteredClients.map((client) => {
                    const hasEmail = Boolean(client.email && client.email.trim().length > 0);
                    const canAutoSend = hasEmail && client.enableInvoice;

                    return (
                      <tr key={client.id} className='hover:bg-gray-50/60 transition-colors'>
                        {/* Client column */}
                        <td className='py-4 px-4 sm:px-6'>
                          <div className='space-y-1'>
                            <Link
                              href={`/clients/${client.id}`}
                              className='font-semibold text-gray-900 hover:text-blue-600 hover:underline decoration-blue-400 transition-colors block'>
                              {client.name}
                            </Link>
                            <div className='flex items-center gap-2'>
                              {hasEmail ? (
                                <span className='text-xs text-gray-500 truncate max-w-[200px]'>
                                  ✉️ {client.email}
                                </span>
                              ) : (
                                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200'>
                                  <span>⚠️</span>
                                  <span>No Email</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Pre-Cleaning Reminder */}
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-2.5'>
                            <ToggleSwitch
                              checked={client.enableAppointmentReminder}
                              disabled={isPending && pendingKey === `${client.id}-enableAppointmentReminder`}
                              onChange={(val) =>
                                handleToggle(client.id, "enableAppointmentReminder", val)
                              }
                            />
                            {client.enableAppointmentReminder && (
                              <select
                                value={client.reminderDaysBefore}
                                disabled={isPending && pendingKey === `${client.id}-reminderDaysBefore`}
                                onChange={(e) =>
                                  handleToggle(
                                    client.id,
                                    "reminderDaysBefore",
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                className='text-xs font-semibold bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-blue-700 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors'>
                                <option value={1}>1d before</option>
                                <option value={2}>2d before</option>
                                <option value={3}>3d before</option>
                                <option value={4}>4d before</option>
                                <option value={5}>5d before</option>
                                <option value={7}>7d before</option>
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Invoice Generation */}
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-2'>
                            <ToggleSwitch
                              checked={client.enableInvoice}
                              disabled={isPending && pendingKey === `${client.id}-enableInvoice`}
                              onChange={(val) => handleToggle(client.id, "enableInvoice", val)}
                            />
                            <span className='text-xs text-gray-500'>
                              {client.enableInvoice ? "On completion" : "Off"}
                            </span>
                          </div>
                        </td>

                        {/* Auto-Send Invoice (High Risk) */}
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-2.5'>
                            <ToggleSwitch
                              checked={client.autoSendInvoice}
                              disabled={
                                !canAutoSend ||
                                (isPending && pendingKey === `${client.id}-autoSendInvoice`)
                              }
                              onChange={(val) => handleToggle(client.id, "autoSendInvoice", val)}
                            />
                            {client.autoSendInvoice ? (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'>
                                <span>⚡</span>
                                <span>Auto-Sends</span>
                              </span>
                            ) : (
                              <span className='text-xs text-gray-400'>
                                {!hasEmail
                                  ? "Needs email"
                                  : !client.enableInvoice
                                  ? "Enable invoice first"
                                  : "Manual review"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Overdue Payment Chaser */}
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-2'>
                            <ToggleSwitch
                              checked={client.enablePaymentReminder}
                              disabled={
                                isPending && pendingKey === `${client.id}-enablePaymentReminder`
                              }
                              onChange={(val) =>
                                handleToggle(client.id, "enablePaymentReminder", val)
                              }
                            />
                            <span className='text-xs text-gray-500'>
                              {client.enablePaymentReminder ? "Every 3d" : "Off"}
                            </span>
                          </div>
                        </td>

                        {/* Channel Badge */}
                        <td className='py-4 px-4 text-right'>
                          <div className='inline-flex flex-col items-end gap-1'>
                            <span className='inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200'>
                              Email
                            </span>
                            <span className='text-[10px] text-gray-400'>SMS Soon</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className='md:hidden space-y-4'>
            {filteredClients.map((client) => {
              const hasEmail = Boolean(client.email && client.email.trim().length > 0);
              const canAutoSend = hasEmail && client.enableInvoice;

              return (
                <div
                  key={client.id}
                  className='bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3.5'>
                  {/* Card Header */}
                  <div className='flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100'>
                    <div>
                      <Link
                        href={`/clients/${client.id}`}
                        className='font-bold text-gray-900 hover:text-blue-600 text-base'>
                        {client.name}
                      </Link>
                      <div className='mt-0.5'>
                        {hasEmail ? (
                          <span className='text-xs text-gray-500'>✉️ {client.email}</span>
                        ) : (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200'>
                            ⚠️ No email address
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className='text-xs font-semibold text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50'>
                      Edit
                    </Link>
                  </div>

                  {/* Toggle Rows */}
                  <div className='space-y-3 text-xs'>
                    {/* Row 1: Pre-clean reminder */}
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <span className='font-semibold text-gray-800 block'>
                          Pre-cleaning Reminder
                        </span>
                        <span className='text-[11px] text-gray-400'>
                          Notifies customer before cleaning
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {client.enableAppointmentReminder && (
                          <select
                            value={client.reminderDaysBefore}
                            onChange={(e) =>
                              handleToggle(
                                client.id,
                                "reminderDaysBefore",
                                parseInt(e.target.value, 10)
                              )
                            }
                            className='text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-2 py-1'>
                            <option value={1}>1d</option>
                            <option value={2}>2d</option>
                            <option value={3}>3d</option>
                            <option value={5}>5d</option>
                            <option value={7}>7d</option>
                          </select>
                        )}
                        <ToggleSwitch
                          checked={client.enableAppointmentReminder}
                          onChange={(val) =>
                            handleToggle(client.id, "enableAppointmentReminder", val)
                          }
                        />
                      </div>
                    </div>

                    {/* Row 2: Invoice creation */}
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <span className='font-semibold text-gray-800 block'>Create Invoice</span>
                        <span className='text-[11px] text-gray-400'>
                          Auto-generate invoice when cleaning ends
                        </span>
                      </div>
                      <ToggleSwitch
                        checked={client.enableInvoice}
                        onChange={(val) => handleToggle(client.id, "enableInvoice", val)}
                      />
                    </div>

                    {/* Row 3: Auto-Send invoice */}
                    <div className='flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-200/60'>
                      <div>
                        <span className='font-semibold text-amber-950 flex items-center gap-1.5'>
                          <span>⚡ Auto-Send PDF</span>
                          {client.autoSendInvoice && (
                            <span className='text-[10px] font-bold text-amber-700'>(Active)</span>
                          )}
                        </span>
                        <span className='text-[10px] text-amber-800/80 block'>
                          {!hasEmail
                            ? "Disabled: Email required"
                            : !client.enableInvoice
                            ? "Disabled: Enable invoice first"
                            : "Emails immediately on completion"}
                        </span>
                      </div>
                      <ToggleSwitch
                        checked={client.autoSendInvoice}
                        disabled={!canAutoSend}
                        onChange={(val) => handleToggle(client.id, "autoSendInvoice", val)}
                      />
                    </div>

                    {/* Row 4: Overdue payment chaser */}
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <span className='font-semibold text-gray-800 block'>Overdue Chaser</span>
                        <span className='text-[11px] text-gray-400'>
                          Reminds unpaid invoices every 3 days
                        </span>
                      </div>
                      <ToggleSwitch
                        checked={client.enablePaymentReminder}
                        onChange={(val) => handleToggle(client.id, "enablePaymentReminder", val)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, disabled = false, onChange }: ToggleSwitchProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}>
      <span
        aria-hidden='true'
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
