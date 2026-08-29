export default function ClientsLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2'>
        <div className='space-y-2'>
          <div className='h-8 w-32 bg-gray-200 rounded-xl' />
          <div className='h-4 w-60 bg-gray-100 rounded-lg' />
        </div>
        <div className='h-10 w-32 bg-gray-200 rounded-xl' />
      </div>

      {/* Clients Grid Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='border border-gray-200 p-5 sm:p-6 rounded-2xl bg-white shadow-xs flex flex-col justify-between gap-4'>
            <div className='space-y-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='h-5 w-36 bg-gray-200 rounded' />
                <div className='h-6 w-12 bg-gray-100 rounded-lg' />
              </div>

              <div className='space-y-2'>
                <div className='h-3.5 w-48 bg-gray-100 rounded' />
                <div className='h-3.5 w-40 bg-gray-100 rounded' />
                <div className='h-3.5 w-28 bg-gray-100 rounded' />
              </div>
            </div>

            {/* Automation Badges Skeleton */}
            <div className='flex flex-wrap gap-2 pt-3 border-t border-gray-100'>
              <div className='h-5 w-24 bg-gray-100 rounded-md' />
              <div className='h-5 w-28 bg-gray-100 rounded-md' />
              <div className='h-5 w-24 bg-gray-100 rounded-md' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
