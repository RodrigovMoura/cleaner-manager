"use client";

import { useState, useTransition } from "react";
import { updateBankDetails } from "@/actions/settings";
import { BankDetailsErrors } from "@/lib/validation";

interface BankDetailsData {
  name: string;
  email: string;
  bankAccountName: string | null;
  bankBsb: string | null;
  bankAccountNo: string | null;
  payId: string | null;
}

interface SettingsFormProps {
  initialData: BankDetailsData | null;
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    bankAccountName: initialData?.bankAccountName || initialData?.name || "",
    bankBsb: initialData?.bankBsb || "",
    bankAccountNo: initialData?.bankAccountNo || "",
    payId: initialData?.payId || "",
  });

  const [errors, setErrors] = useState<BankDetailsErrors>({});
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const handleBsbChange = (value: string) => {
    // Automatically clean non-digits and insert hyphen after 3 digits if typed continuously
    const clean = value.replace(/[^\d-]/g, "");
    const digitsOnly = clean.replace(/\D/g, "").slice(0, 6);

    let formatted = digitsOnly;
    if (digitsOnly.length > 3) {
      formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    }

    setFormData((prev) => ({ ...prev, bankBsb: formatted }));
    if (errors.bankBsb) setErrors((prev) => ({ ...prev, bankBsb: undefined }));
  };

  const handleAccountNoChange = (value: string) => {
    const clean = value.replace(/[^\d\s]/g, "").slice(0, 12);
    setFormData((prev) => ({ ...prev, bankAccountNo: clean }));
    if (errors.bankAccountNo) setErrors((prev) => ({ ...prev, bankAccountNo: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrors({});

    const submitData = new FormData();
    submitData.append("bankAccountName", formData.bankAccountName);
    submitData.append("bankBsb", formData.bankBsb);
    submitData.append("bankAccountNo", formData.bankAccountNo);
    submitData.append("payId", formData.payId);

    startTransition(async () => {
      try {
        const res = await updateBankDetails(submitData);
        if (res.success) {
          setFeedback({ type: "success", message: res.message });
        } else {
          setFeedback({ type: "error", message: res.message });
          if (res.errors) {
            setErrors(res.errors);
          }
        }
      } catch (err) {
        console.error("Error saving bank details:", err);
        setFeedback({
          type: "error",
          message: "Failed to connect to the server. Please try again.",
        });
      }
    });
  };

  const isConfigured = Boolean(formData.bankBsb && formData.bankAccountNo);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      {/* Left Column: Form */}
      <div className='lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-xs'>
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <h2 className='text-base sm:text-lg font-bold text-gray-900'>Bank Transfer Details</h2>
            <p className='text-xs text-gray-500 mt-1'>
              These details will be displayed on all generated invoices and automated reminder emails.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
              <span>{feedback.type === "success" ? "✓" : "⚠️"}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Account Name */}
          <div className='space-y-1.5'>
            <label htmlFor='bankAccountName' className='block text-xs font-bold text-gray-700 uppercase tracking-wider'>
              Account Name <span className='text-red-500'>*</span>
            </label>
            <input
              id='bankAccountName'
              type='text'
              value={formData.bankAccountName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, bankAccountName: e.target.value }));
                if (errors.bankAccountName) setErrors((prev) => ({ ...prev, bankAccountName: undefined }));
              }}
              placeholder='e.g. Rodrigo Moura or Moura Cleaning Services'
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.bankAccountName ? "border-red-300 focus:ring-red-400" : "border-gray-200"
              }`}
            />
            {errors.bankAccountName && (
              <p className='text-xs text-red-600 font-medium'>{errors.bankAccountName}</p>
            )}
            <p className='text-[11px] text-gray-400'>
              The account holder name or registered business name matching your bank account.
            </p>
          </div>

          {/* Grid: BSB and Account Number */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* BSB */}
            <div className='space-y-1.5'>
              <label htmlFor='bankBsb' className='block text-xs font-bold text-gray-700 uppercase tracking-wider'>
                BSB <span className='text-red-500'>*</span>
              </label>
              <input
                id='bankBsb'
                type='text'
                value={formData.bankBsb}
                onChange={(e) => handleBsbChange(e.target.value)}
                placeholder='062-000'
                maxLength={7}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankBsb ? "border-red-300 focus:ring-red-400" : "border-gray-200"
                }`}
              />
              {errors.bankBsb && <p className='text-xs text-red-600 font-medium'>{errors.bankBsb}</p>}
              <p className='text-[11px] text-gray-400'>6-digit Australian Bank State Branch code.</p>
            </div>

            {/* Account Number */}
            <div className='space-y-1.5'>
              <label
                htmlFor='bankAccountNo'
                className='block text-xs font-bold text-gray-700 uppercase tracking-wider'>
                Account Number <span className='text-red-500'>*</span>
              </label>
              <input
                id='bankAccountNo'
                type='text'
                value={formData.bankAccountNo}
                onChange={(e) => handleAccountNoChange(e.target.value)}
                placeholder='1234 5678'
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankAccountNo ? "border-red-300 focus:ring-red-400" : "border-gray-200"
                }`}
              />
              {errors.bankAccountNo && (
                <p className='text-xs text-red-600 font-medium'>{errors.bankAccountNo}</p>
              )}
              <p className='text-[11px] text-gray-400'>Usually 6 to 10 digits.</p>
            </div>
          </div>

          {/* PayID (Optional) */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label htmlFor='payId' className='block text-xs font-bold text-gray-700 uppercase tracking-wider'>
                PayID <span className='text-gray-400 font-normal lowercase'>(optional)</span>
              </label>
              <span className='text-[11px] text-gray-400'>Instant transfer identifier</span>
            </div>
            <input
              id='payId'
              type='text'
              value={formData.payId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, payId: e.target.value }));
                if (errors.payId) setErrors((prev) => ({ ...prev, payId: undefined }));
              }}
              placeholder='e.g. 0412 345 678 or cleaning@business.com.au'
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.payId ? "border-red-300 focus:ring-red-400" : "border-gray-200"
              }`}
            />
            {errors.payId && <p className='text-xs text-red-600 font-medium'>{errors.payId}</p>}
            <p className='text-[11px] text-gray-400'>
              Australian PayID registered to your bank (mobile number, email address, or ABN).
            </p>
          </div>

          <div className='pt-3 border-t border-gray-100 flex items-center justify-end'>
            <button
              type='submit'
              disabled={isPending}
              className='inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs disabled:opacity-50'>
              {isPending ? (
                <>
                  <span className='animate-spin text-xs'>⏳</span>
                  <span>Saving details...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Bank Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Invoice Preview */}
      <div className='lg:col-span-5 space-y-4'>
        <div className='bg-gradient-to-br from-gray-50 to-blue-50/40 border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3.5'>
          <div className='flex items-center justify-between'>
            <h3 className='text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5'>
              <span>📄</span>
              <span>Invoice Preview</span>
            </h3>
            {isConfigured ? (
              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                ✓ Ready for Invoices
              </span>
            ) : (
              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200'>
                Incomplete Details
              </span>
            )}
          </div>

          <p className='text-xs text-gray-500 leading-relaxed'>
            Here is how your payment instructions will appear inside your customer PDF invoices and email notices:
          </p>

          {/* Render Mock Payment Box */}
          <div className='bg-white border border-gray-200 rounded-xl p-4 space-y-2 shadow-2xs'>
            <div className='border-b border-gray-100 pb-2 flex items-center justify-between'>
              <span className='text-[11px] font-bold text-gray-900 uppercase tracking-wide'>
                How to Pay (Direct Bank Transfer)
              </span>
              <span className='text-[10px] text-gray-400 font-mono'>AUD</span>
            </div>

            <div className='space-y-1.5 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Account Name:</span>
                <span className='font-semibold text-gray-900 text-right truncate max-w-[180px]'>
                  {formData.bankAccountName || <em className='text-gray-300 font-normal'>Not configured</em>}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>BSB:</span>
                <span className='font-mono font-semibold text-gray-900'>
                  {formData.bankBsb || <em className='text-gray-300 font-normal'>000-000</em>}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-500'>Account Number:</span>
                <span className='font-mono font-semibold text-gray-900'>
                  {formData.bankAccountNo || <em className='text-gray-300 font-normal'>1234 5678</em>}
                </span>
              </div>
              {formData.payId && (
                <div className='flex items-center justify-between'>
                  <span className='text-gray-500'>PayID:</span>
                  <span className='font-semibold text-blue-700 text-right truncate max-w-[180px]'>
                    {formData.payId}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between pt-1 border-t border-gray-100'>
                <span className='text-gray-500'>Reference:</span>
                <span className='font-mono font-bold text-blue-600'>INV-2026-0042</span>
              </div>
            </div>
          </div>

          <div className='text-[11px] text-gray-400 flex items-start gap-1.5'>
            <span>💡</span>
            <span>
              The reference number is automatically generated with each invoice so you can easily match incoming bank payments.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
