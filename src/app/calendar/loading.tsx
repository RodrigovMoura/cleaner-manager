export default function CalendarLoading() {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className='max-w-7xl mx-auto p-2 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-pulse'>
      {/* Top Header & Calendar Controls Bar Skeleton */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div className='space-y-2'>
          <div className='h-8 w-40 bg-gray-200 rounded-xl' />
          <div className='h-4 w-72 sm:w-96 bg-gray-100 rounded-lg' />
        </div>

        {/* View Mode Switcher and Schedule Button Skeleton */}
        <div className='flex items-center gap-2 flex-wrap sm:flex-nowrap'>
          <div className='bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200'>
            <div className='h-7 w-14 bg-white rounded-lg shadow-xs' />
            <div className='h-7 w-16 bg-gray-200 rounded-lg' />
            <div className='h-7 w-18 bg-gray-200 rounded-lg' />
            <div className='h-7 w-16 bg-gray-200 rounded-lg' />
          </div>
          <div className='h-9 w-28 bg-gray-200 rounded-xl shrink-0' />
        </div>
      </div>

      {/* Period Navigation and Demand Summary Strip Skeleton */}
      <div className='bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        {/* Navigation Buttons and Period Title */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1'>
            <div className='h-7 w-14 bg-gray-200 rounded-xl' />
            <div className='h-7 w-7 bg-gray-100 rounded-xl' />
            <div className='h-7 w-7 bg-gray-100 rounded-xl' />
          </div>
          <div className='h-6 w-48 bg-gray-200 rounded-lg' />
        </div>

        {/* Workload / Demand Indicators */}
        <div className='flex items-center gap-3'>
          <div className='h-7 w-28 bg-blue-50/80 border border-blue-100 rounded-lg' />
          <div className='h-7 w-32 bg-emerald-50/80 border border-emerald-100 rounded-lg' />
        </div>
      </div>

      {/* Main Calendar Display Skeleton */}
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
        {/* Weekday Column Headers */}
        <div className='grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 py-2.5 px-1 sm:px-2'>
          {weekdays.map((day) => (
            <div key={day} className='flex justify-center'>
              <div className='h-3.5 w-8 sm:w-10 bg-gray-200 rounded' />
            </div>
          ))}
        </div>

        {/* 7-Day Columns Grid Skeleton */}
        <div className='grid grid-cols-7 divide-x divide-gray-200 min-h-[440px]'>
          {weekdays.map((_, colIndex) => (
            <div key={colIndex} className='p-1.5 sm:p-3 space-y-2.5 bg-white'>
              {/* Day Number Header */}
              <div className='flex justify-center sm:justify-start pb-1'>
                <div className='h-5 w-5 bg-gray-200 rounded-full' />
              </div>

              {/* Sample appointment cards inside some days */}
              {colIndex % 2 === 0 && (
                <div className='p-2 sm:p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5'>
                  <div className='h-3 w-14 sm:w-20 bg-blue-200 rounded' />
                  <div className='h-2.5 w-10 sm:w-14 bg-blue-100 rounded' />
                </div>
              )}

              {colIndex === 1 || colIndex === 4 ? (
                <div className='p-2 sm:p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5'>
                  <div className='h-3 w-16 sm:w-22 bg-emerald-200 rounded' />
                  <div className='h-2.5 w-12 sm:w-16 bg-emerald-100 rounded' />
                </div>
              ) : null}

              {colIndex === 3 && (
                <div className='p-2 sm:p-2.5 bg-gray-100 border border-gray-200 rounded-xl space-y-1.5'>
                  <div className='h-3 w-12 sm:w-16 bg-gray-200 rounded' />
                  <div className='h-2.5 w-10 sm:w-12 bg-gray-100 rounded' />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
