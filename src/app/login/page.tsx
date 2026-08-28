"use client";

import { loginUser } from "@/actions/auth";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<null | string>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginUser(formData);
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch {
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
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Login</h1>
          <p className='text-sm text-gray-500'>Access your customer management account.</p>
        </div>

        {/* Auth Card */}
        <div className='bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-5'>
          {error && (
            <div
              className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5'
              role='alert'>
              <span className='text-base leading-none'>⚠️</span>
              <span className='font-medium'>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4' noValidate>
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
                placeholder='name@example.com'
                className='w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
              />
            </div>

            <div className='space-y-1.5'>
              <label htmlFor='password' className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                required
                autoComplete='current-password'
                placeholder='••••••••'
                className='w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all'
              />
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
                  <span>Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className='pt-4 border-t border-gray-100 text-center'>
            <p className='text-xs text-gray-500'>
              Don&apos;t have an account?{" "}
              <Link href='/register' className='font-semibold text-blue-600 hover:text-blue-700 hover:underline'>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
