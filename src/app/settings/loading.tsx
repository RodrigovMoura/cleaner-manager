export default function SettingsLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6 animate-pulse'>
      {/* Header Skeleton */}
      <div className='pb-4 border-b border-gray-200 space-y-2'>
        <div className='h-8 w-32 bg-gray-200 rounded-xl' />
        <div className='h-4 w-72 sm:w-96 bg-gray-100 rounded-lg' />
      </div>

      {/* Two-Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form Skeleton (7 cols) */}
        <div className='lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5'>
          <div className='space-y-1.5'>
            <div className='h-5 w-44 bg-gray-200 rounded' />
            <div className='h-3.5 w-72 bg-gray-100 rounded' />
          </div>

          <div className='space-y-4 pt-1'>
            {/* Account Name */}
            <div className='space-y-1.5'>
              <div className='h-3.5 w-28 bg-gray-200 rounded' />
              <div className='h-10 w-full bg-gray-100 rounded-xl' />
              <div className='h-3 w-64 bg-gray-100 rounded' />
            </div>

            {/* BSB & Account Number */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <div className='h-3.5 w-16 bg-gray-200 rounded' />
                <div className='h-10 w-full bg-gray-100 rounded-xl' />
                <div className='h-3 w-40 bg-gray-100 rounded' />
              </div>
              <div className='space-y-1.5'>
                <div className='h-3.5 w-28 bg-gray-200 rounded' />
                <div className='h-10 w-full bg-gray-100 rounded-xl' />
                <div className='h-3 w-36 bg-gray-100 rounded' />
              </div>
            </div>

            {/* PayID */}
            <div className='space-y-1.5'>
              <div className='h-3.5 w-20 bg-gray-200 rounded' />
              <div className='h-10 w-full bg-gray-100 rounded-xl' />
              <div className='h-3 w-56 bg-gray-100 rounded' />
            </div>

            {/* Submit Button */}
            <div className='pt-3 border-t border-gray-100 flex justify-end'>
              <div className='h-10 w-36 bg-gray-200 rounded-xl' />
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Preview Skeleton (5 cols) */}
        <div className='lg:col-span-5 space-y-4'>
          <div className='bg-gradient-to-br from-gray-50 to-blue-50/40 border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3.5'>
            <div className='flex items-center justify-between'>
              <div className='h-4 w-28 bg-gray-200 rounded' />
              <div className='h-5 w-24 bg-emerald-100 rounded-full' />
            </div>

            <div className='h-3 w-72 bg-gray-100 rounded' />

            {/* Mock Payment Box */}
            <div className='bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs'>
              <div className='border-b border-gray-100 pb-2'>
                <div className='h-3.5 w-44 bg-gray-200 rounded' />
              </div>

              <div className='space-y-2.5 pt-1'>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className='flex items-center justify-between py-0.5'>
                    <div className='h-3 w-20 bg-gray-100 rounded' />
                    <div className='h-3 w-28 bg-gray-200 rounded' />
                  </div>
                ))}
              </div>

              <div className='pt-2 border-t border-gray-100'>
                <div className='h-2.5 w-52 bg-gray-100 rounded' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
