"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/actions/client";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  validateName,
  validatePhone,
  validateEmail,
  validateAddress,
  validateClientData,
  ClientErrors,
} from "@/lib/validation";

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    enableAppointmentReminder: true,
    reminderDaysBefore: "1",
    enableInvoice: true,
    autoSendInvoice: false,
    enablePaymentReminder: true,
  });

  const [fieldErrors, setFieldErrors] = useState<ClientErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (fieldErrors[field as keyof ClientErrors]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ClientErrors];
        return next;
      });
    }
  };

  const handleBlur = (field: "name" | "phone" | "email" | "address") => {
    const val = String(formData[field] || "");

    if (field === "name" && val.trim()) {
      const res = validateName(val);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, name: res.error }));
      }
    } else if (field === "phone" && val.trim()) {
      const res = validatePhone(val, true);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, phone: res.error }));
      }
    } else if (field === "email" && val.trim()) {
      const res = validateEmail(val);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, email: res.error }));
      }
    } else if (field === "address" && val.trim()) {
      const res = validateAddress(val);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, address: res.error }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validação completa no cliente antes do envio
    const validation = validateClientData({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      reminderDaysBefore: formData.reminderDaysBefore,
      autoSendInvoice: formData.autoSendInvoice,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setStatus("loading");

    const submitData = new FormData();
    submitData.append("name", formData.name.trim());
    submitData.append("email", formData.email.trim().toLowerCase());
    submitData.append("phone", formData.phone.trim());
    submitData.append("address", formData.address.trim());

    if (formData.enableAppointmentReminder) submitData.append("enableAppointmentReminder", "on");
    submitData.append("reminderDaysBefore", formData.reminderDaysBefore);
    if (formData.enableInvoice) submitData.append("enableInvoice", "on");
    if (formData.autoSendInvoice) submitData.append("autoSendInvoice", "on");
    if (formData.enablePaymentReminder) submitData.append("enablePaymentReminder", "on");

    const result = await createClient(submitData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
    } else {
      setStatus("error");
      setMessage(result.message || "Something went wrong.");
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  };

  const handleCloseModal = () => {
    if (status === "success") {
      router.push("/clients");
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 relative space-y-6'>
      <div className='flex items-center justify-between pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Add New Client</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Configure client details and automation toggles.</p>
        </div>
        <Link
          href='/clients'
          className='text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-colors shadow-2xs'>
          Cancel
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // Prevent accidental form submission when pressing Enter in inputs
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
          }
        }}
        noValidate
        className='space-y-6'>
        {/* Contact Information */}
        <div className='bg-white p-5 sm:p-7 border border-gray-200 rounded-2xl shadow-xs space-y-5'>
          <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>General Information</h2>

          <div className='space-y-4'>
            {/* Name */}
            <div className='space-y-1.5'>
              <label htmlFor='name' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Full Name *
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                maxLength={70}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder='e.g. Sarah Jenkins'
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  fieldErrors.name
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
              {fieldErrors.name && (
                <p id='name-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Email */}
              <div className='space-y-1.5'>
                <label htmlFor='email' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Email Address {formData.autoSendInvoice && <span className='text-red-500'>*</span>}
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  maxLength={254}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder='sarah@example.com'
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                    fieldErrors.email
                      ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  }`}
                />
                {fieldErrors.email && (
                  <p id='email-error' className='text-xs text-red-600 font-medium mt-1'>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className='space-y-1.5'>
                <label htmlFor='phone' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                  Phone Number *
                </label>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  required
                  maxLength={25}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder='+61 400 000 000'
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                    fieldErrors.phone
                      ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  }`}
                />
                {fieldErrors.phone && (
                  <p id='phone-error' className='text-xs text-red-600 font-medium mt-1'>
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className='space-y-1.5'>
              <AddressAutocomplete
                name='address'
                value={formData.address}
                onChange={(val) => handleInputChange("address", val)}
                onBlur={() => handleBlur("address")}
                hasError={Boolean(fieldErrors.address)}
                required
              />
              {fieldErrors.address && (
                <p id='address-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Automation Preferences */}
        <div className='bg-white p-5 sm:p-7 border border-gray-200 rounded-2xl shadow-xs space-y-5'>
          <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
            Automation & Notification Rules
          </h2>

          {/* Appointment Reminder */}
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='pr-2'>
                <label htmlFor='enableAppointmentReminder' className='text-sm font-bold text-gray-900 block'>
                  Appointment Reminders
                </label>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Send an automatic reminder message prior to scheduled cleanings.
                </p>
              </div>
              <input
                id='enableAppointmentReminder'
                name='enableAppointmentReminder'
                type='checkbox'
                checked={formData.enableAppointmentReminder}
                onChange={(e) => handleInputChange("enableAppointmentReminder", e.target.checked)}
                className='h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer accent-blue-600'
              />
            </div>

            <div className='pl-3.5 border-l-2 border-blue-200 space-y-1'>
              <label htmlFor='reminderDaysBefore' className='block text-xs font-semibold text-gray-700'>
                Send reminder
              </label>
              <select
                id='reminderDaysBefore'
                name='reminderDaysBefore'
                value={formData.reminderDaysBefore}
                onChange={(e) => handleInputChange("reminderDaysBefore", e.target.value)}
                className='px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white'>
                <option value='1'>1 day before</option>
                <option value='2'>2 days before</option>
                <option value='3'>3 days before</option>
              </select>
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Invoices */}
          <div className='space-y-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='pr-2'>
                <label htmlFor='enableInvoice' className='text-sm font-bold text-gray-900 block'>
                  Generate Invoices
                </label>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Automatically create an invoice when cleanings are completed.
                </p>
              </div>
              <input
                id='enableInvoice'
                name='enableInvoice'
                type='checkbox'
                checked={formData.enableInvoice}
                onChange={(e) => handleInputChange("enableInvoice", e.target.checked)}
                className='h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer accent-blue-600'
              />
            </div>

            <div className='flex items-start justify-between gap-3 pl-3.5 border-l-2 border-blue-200'>
              <div className='pr-2'>
                <label htmlFor='autoSendInvoice' className='text-xs font-semibold text-gray-800 block'>
                  Automatic Invoice Delivery
                </label>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Email invoice instantly on completion (uncheck for 1-click manual review).
                </p>
              </div>
              <input
                id='autoSendInvoice'
                name='autoSendInvoice'
                type='checkbox'
                checked={formData.autoSendInvoice}
                onChange={(e) => handleInputChange("autoSendInvoice", e.target.checked)}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer accent-blue-600'
              />
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Payment Reminders */}
          <div className='flex items-start justify-between gap-3'>
            <div className='pr-2'>
              <label htmlFor='enablePaymentReminder' className='text-sm font-bold text-gray-900 block'>
                Overdue Payment Reminders
              </label>
              <p className='text-xs text-gray-500 mt-0.5'>Allow payment follow-up notifications for overdue invoices.</p>
            </div>
            <input
              id='enablePaymentReminder'
              name='enablePaymentReminder'
              type='checkbox'
              checked={formData.enablePaymentReminder}
              onChange={(e) => handleInputChange("enablePaymentReminder", e.target.checked)}
              className='h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer accent-blue-600'
            />
          </div>
        </div>

        <div className='flex items-center justify-end gap-3 pt-2'>
          <Link
            href='/clients'
            className='px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs'>
            Cancel
          </Link>
          <button
            type='submit'
            disabled={status === "loading"}
            className='px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2'>
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
                <span>Saving...</span>
              </>
            ) : (
              "Save Client"
            )}
          </button>
        </div>
      </form>

      {/* Notification Modal */}
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
            <h3 className='text-lg font-bold text-gray-900 mb-1'>{status === "success" ? "Success!" : "Error"}</h3>
            <p className='text-sm text-gray-500 mb-6'>{message}</p>
            <button
              onClick={handleCloseModal}
              className='w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs'>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
