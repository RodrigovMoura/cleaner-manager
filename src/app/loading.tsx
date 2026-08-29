export default function DashboardLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-pulse'>
      {/* Top Header Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200'>
        <div className='space-y-2'>
          <div className='h-8 w-40 bg-gray-200 rounded-xl' />
          <div className='h-4 w-56 bg-gray-100 rounded-lg' />
        </div>
        <div className='flex items-center gap-2.5 flex-wrap sm:flex-nowrap'>
          <div className='h-10 w-36 bg-gray-200 rounded-xl' />
          <div className='h-10 w-28 bg-gray-200 rounded-xl' />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3'>
            <div className='h-3 w-20 bg-gray-200 rounded' />
            <div className='h-7 w-24 bg-gray-200 rounded-lg' />
          </div>
        ))}
      </div>

      {/* Quick Navigation Hub Skeleton */}
      <div className='grid grid-cols-3 gap-2.5 sm:gap-4'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className='p-3.5 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs text-center flex flex-col items-center justify-center space-y-2'>
            <div className='w-8 h-8 bg-gray-200 rounded-full' />
            <div className='h-4 w-16 bg-gray-200 rounded' />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Upcoming Cleanings (Takes 2 cols on desktop) */}
        <div className='lg:col-span-2 space-y-3.5'>
          <div className='flex items-center justify-between'>
            <div className='h-5 w-36 bg-gray-200 rounded' />
            <div className='h-4 w-16 bg-gray-100 rounded' />
          </div>

          <div className='space-y-2.5'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex items-center justify-between gap-3'>
                <div className='space-y-2 min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-32 bg-gray-200 rounded' />
                    <div className='h-4 w-14 bg-gray-100 rounded-full' />
                  </div>
                  <div className='h-3 w-48 bg-gray-100 rounded' />
                </div>
                <div className='h-5 w-14 bg-gray-200 rounded' />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Pending Invoices Summary */}
        <div className='space-y-3.5'>
          <div className='flex items-center justify-between'>
            <div className='h-5 w-32 bg-gray-200 rounded' />
            <div className='h-4 w-20 bg-gray-100 rounded' />
          </div>

          <div className='bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
            <div className='space-y-2'>
              <div className='h-3 w-28 bg-gray-200 rounded' />
              <div className='h-8 w-24 bg-gray-200 rounded-lg' />
            </div>

            <div className='border-t border-gray-100 pt-3.5 space-y-2'>
              <div className='flex justify-between py-1'>
                <div className='h-3 w-24 bg-gray-100 rounded' />
                <div className='h-3 w-6 bg-gray-200 rounded' />
              </div>
              <div className='flex justify-between py-1'>
                <div className='h-3 w-24 bg-gray-100 rounded' />
                <div className='h-3 w-6 bg-gray-200 rounded' />
              </div>
            </div>

            <div className='h-10 w-full bg-gray-100 rounded-xl' />
          </div>
        </div>
      </div>
    </div>
  );
}
