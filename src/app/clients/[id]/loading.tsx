export default function ClientDetailsLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div className='space-y-2'>
          <div className='h-8 w-48 bg-gray-200 rounded-xl' />
          <div className='h-4 w-40 bg-gray-100 rounded-lg' />
        </div>
        <div className='flex items-center gap-2.5 flex-wrap sm:flex-nowrap'>
          <div className='h-10 w-32 bg-gray-200 rounded-xl' />
          <div className='h-10 w-28 bg-gray-200 rounded-xl' />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Client Info & Preferences */}
        <div className='space-y-6'>
          {/* Contact Info Skeleton */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='h-4 w-36 bg-gray-200 rounded' />
            <div className='space-y-3 divide-y divide-gray-100'>
              <div className='pt-1 first:pt-0 space-y-1.5'>
                <div className='h-3 w-12 bg-gray-100 rounded' />
                <div className='h-4 w-44 bg-gray-200 rounded' />
              </div>
              <div className='pt-2.5 space-y-1.5'>
                <div className='h-3 w-12 bg-gray-100 rounded' />
                <div className='h-4 w-32 bg-gray-200 rounded' />
              </div>
              <div className='pt-2.5 space-y-1.5'>
                <div className='h-3 w-24 bg-gray-100 rounded' />
                <div className='h-4 w-52 bg-gray-200 rounded' />
              </div>
            </div>
          </div>

          {/* Automation Toggles Summary Skeleton */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='h-4 w-32 bg-gray-200 rounded' />
            <div className='space-y-3.5'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='flex items-center justify-between gap-2'>
                  <div className='h-4 w-36 bg-gray-100 rounded' />
                  <div className='h-5 w-20 bg-gray-100 rounded-full' />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Appointments & Invoices */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Cleaning Schedule Skeleton */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='flex items-center justify-between gap-2 flex-wrap'>
              <div className='h-5 w-36 bg-gray-200 rounded' />
              <div className='flex items-center gap-2'>
                <div className='h-8 w-24 bg-gray-100 rounded-lg' />
                <div className='h-8 w-32 bg-gray-200 rounded-lg' />
              </div>
            </div>

            <div className='space-y-2.5'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='border border-gray-100 bg-gray-50/70 p-3.5 rounded-xl flex items-center justify-between gap-4'>
                  <div className='space-y-1.5 min-w-0'>
                    <div className='h-4 w-40 bg-gray-200 rounded' />
                  </div>
                  <div className='flex items-center gap-3 shrink-0'>
                    <div className='h-4 w-14 bg-gray-200 rounded' />
                    <div className='h-5 w-20 bg-gray-100 rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices & Billing Skeleton */}
          <div className='bg-white p-5 sm:p-6 border border-gray-200 rounded-2xl shadow-xs space-y-4'>
            <div className='flex items-center justify-between gap-2 flex-wrap'>
              <div className='h-5 w-32 bg-gray-200 rounded' />
              <div className='h-8 w-24 bg-gray-100 rounded-lg' />
            </div>

            <div className='space-y-2.5'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='border border-gray-100 bg-gray-50/70 p-3.5 rounded-xl flex items-center justify-between gap-3'>
                  <div className='space-y-1.5 min-w-0'>
                    <div className='h-4 w-36 bg-gray-200 rounded' />
                  </div>
                  <div className='flex items-center gap-2.5 shrink-0'>
                    <div className='h-4 w-14 bg-gray-200 rounded' />
                    <div className='h-4 w-8 bg-gray-100 rounded' />
                    <div className='h-5 w-16 bg-gray-100 rounded-full' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
