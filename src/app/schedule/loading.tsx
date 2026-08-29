export default function ScheduleLoading() {
  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2'>
        <div className='space-y-2'>
          <div className='h-8 w-36 bg-gray-200 rounded-xl' />
          <div className='h-4 w-64 bg-gray-100 rounded-lg' />
        </div>
        <div className='h-10 w-36 bg-gray-200 rounded-xl' />
      </div>

      {/* Tabs Switcher Skeleton */}
      <div className='flex border-b border-gray-200'>
        <div className='flex-1 py-3.5 flex justify-center border-b-2 border-blue-600'>
          <div className='h-4 w-36 bg-blue-100 rounded' />
        </div>
        <div className='flex-1 py-3.5 flex justify-center border-b-2 border-transparent'>
          <div className='h-4 w-36 bg-gray-200 rounded' />
        </div>
      </div>

      {/* Appointments List Skeleton */}
      <div className='space-y-3'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs'>
            <div className='space-y-2 min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <div className='h-5 w-40 bg-gray-200 rounded' />
                <div className='h-5 w-20 bg-gray-100 rounded-full' />
              </div>
              <div className='h-3.5 w-52 bg-gray-100 rounded' />
              <div className='h-3 w-36 bg-gray-100 rounded' />
            </div>

            <div className='flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
              <div className='h-5 w-16 bg-gray-200 rounded' />
              <div className='h-8 w-24 bg-gray-100 rounded-lg' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
