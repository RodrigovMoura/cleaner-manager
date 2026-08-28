"use client";

import { registerUser } from "@/actions/auth";
import { useState } from "react";
import Link from "next/link";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateRegistrationData,
  RegistrationErrors,
} from "@/lib/validation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field error on change if it exists
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (serverError) {
      setServerError(null);
    }
  }

  function handleBlur(field: keyof typeof formData) {
    const value = formData[field];

    if (field === "name" && value.trim()) {
      const res = validateName(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, name: res.error }));
      }
    } else if (field === "email" && value.trim()) {
      const res = validateEmail(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, email: res.error }));
      }
    } else if (field === "password" && value) {
      const res = validatePassword(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, password: res.error }));
      }
    } else if (field === "confirmPassword" && value) {
      if (value !== formData.password) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    // Client-side validation
    const validation = validateRegistrationData({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = new FormData();
      submissionData.append("name", formData.name.trim());
      submissionData.append("email", formData.email.trim().toLowerCase());
      submissionData.append("password", formData.password);
      submissionData.append("confirmPassword", formData.confirmPassword);

      const result = await registerUser(submissionData);

      if (result && (!result.success || result.error)) {
        setServerError(result.error || result.message || "Registration failed. Please check your data.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-6'>
        {/* Brand / Header */}
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-2xl mb-1 shadow-2xs'>
            ✨
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Register</h1>
          <p className='text-sm text-gray-500'>Create your cleaner management account.</p>
        </div>

        {/* Restricted Access / Authorized Email Notice */}
        <div
          className='p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5 shadow-2xs'
          role='note'
          aria-label='Registration access notice'>
          <span className='text-base leading-none shrink-0 mt-0.5' aria-hidden='true'>
            ⚠️
          </span>
          <div className='leading-relaxed'>
            <strong className='font-semibold'>Notice:</strong> Only authorized emails can register an account on this
            platform. If your email is not in the whitelist, registration will be restricted.
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5'
            role='alert'
            aria-live='assertive'>
            <span className='text-base leading-none shrink-0'>⚠️</span>
            <span className='font-medium'>{serverError}</span>
          </div>
        )}

        {/* Registration Card */}
        <div className='bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-5'>
          <form onSubmit={handleSubmit} className='space-y-4' noValidate>
            {/* Name */}
            <div className='space-y-1.5'>
              <label htmlFor='name' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Full Name
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
                autoComplete='name'
                maxLength={70}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  fieldErrors.name
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                placeholder='e.g. John Doe'
              />
              {fieldErrors.name && (
                <p id='name-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className='space-y-1.5'>
              <label htmlFor='email' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                required
                autoComplete='email'
                maxLength={254}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  fieldErrors.email
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                placeholder='name@example.com'
              />
              {fieldErrors.email && (
                <p id='email-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className='space-y-1.5'>
              <label htmlFor='password' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                required
                autoComplete='new-password'
                maxLength={128}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  fieldErrors.password
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                placeholder='••••••••'
              />
              {fieldErrors.password ? (
                <p id='password-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.password}
                </p>
              ) : (
                <p id='password-hint' className='text-[11px] text-gray-400 mt-1'>
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className='space-y-1.5'>
              <label
                htmlFor='confirmPassword'
                className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                name='confirmPassword'
                required
                autoComplete='new-password'
                maxLength={128}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                  fieldErrors.confirmPassword
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                placeholder='••••••••'
              />
              {fieldErrors.confirmPassword && (
                <p id='confirmPassword-error' className='text-xs text-red-600 font-medium mt-1'>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'>
              {isSubmitting ? (
                <>
                  <svg className='animate-spin h-4 w-4 text-white' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className='pt-4 border-t border-gray-100 text-center'>
            <p className='text-xs text-gray-500'>
              Already have an account?{" "}
              <Link href='/login' className='font-semibold text-blue-600 hover:text-blue-700 hover:underline'>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
