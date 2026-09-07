export default function AutomationsLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6 sm:space-y-8 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200'>
        <div className='space-y-2'>
          <div className='h-8 w-64 bg-gray-200 rounded-xl' />
          <div className='h-4 w-80 sm:w-96 bg-gray-100 rounded-lg' />
        </div>
        <div className='h-10 w-32 bg-gray-200 rounded-xl shrink-0' />
      </div>

      {/* KPI Summary Cards Skeleton (4 Cards) */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3'>
            <div className='flex items-center justify-between'>
              <div className='h-3 w-20 bg-gray-200 rounded' />
              <div className='h-5 w-5 bg-gray-100 rounded-full' />
            </div>
            <div className='space-y-1.5'>
              <div className='h-7 w-16 bg-gray-200 rounded-lg' />
              <div className='h-3 w-32 bg-gray-100 rounded' />
            </div>
          </div>
        ))}
      </div>

      {/* Safety Alert & Bulk Actions Bar Skeleton */}
      <div className='bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-start gap-3 w-full sm:w-auto'>
          <div className='w-8 h-8 rounded-lg bg-amber-100 shrink-0' />
          <div className='space-y-2 flex-1'>
            <div className='h-4 w-48 sm:w-64 bg-amber-200/70 rounded' />
            <div className='h-3 w-72 sm:w-96 bg-amber-100/80 rounded' />
          </div>
        </div>
        <div className='h-8 w-36 bg-amber-100/80 border border-amber-200 rounded-xl shrink-0' />
      </div>

      {/* Search and Filters Bar Skeleton */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
        {/* Search Input Skeleton */}
        <div className='h-10 w-full sm:w-80 bg-white border border-gray-200 rounded-xl shadow-2xs' />

        {/* Filter Pills Skeleton */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0'>
          <div className='h-8 w-16 bg-gray-200 rounded-lg shrink-0' />
          <div className='h-8 w-24 bg-gray-100 rounded-lg shrink-0' />
          <div className='h-8 w-24 bg-gray-100 rounded-lg shrink-0' />
          <div className='h-8 w-20 bg-gray-100 rounded-lg shrink-0' />
        </div>
      </div>

      {/* Main Clients Table Skeleton */}
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
        {/* Table Header */}
        <div className='hidden md:grid grid-cols-12 border-b border-gray-200 bg-gray-50/80 py-3.5 px-6 gap-4'>
          <div className='col-span-4 h-3 w-28 bg-gray-200 rounded' />
          <div className='col-span-2 h-3 w-24 bg-gray-200 rounded' />
          <div className='col-span-2 h-3 w-20 bg-gray-200 rounded' />
          <div className='col-span-2 h-3 w-24 bg-gray-200 rounded' />
          <div className='col-span-2 h-3 w-20 bg-gray-200 rounded' />
        </div>

        {/* Table Rows Skeleton */}
        <div className='divide-y divide-gray-100'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='p-4 sm:p-5 flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4'>
              {/* Client Info */}
              <div className='md:col-span-4 space-y-1.5 w-full'>
                <div className='h-4 w-36 bg-gray-200 rounded' />
                <div className='h-3 w-48 bg-gray-100 rounded' />
              </div>

              {/* Toggles */}
              <div className='md:col-span-2 flex items-center gap-2'>
                <div className='h-5 w-9 bg-gray-200 rounded-full' />
                <div className='h-3 w-12 bg-gray-100 rounded md:hidden' />
              </div>

              <div className='md:col-span-2 flex items-center gap-2'>
                <div className='h-5 w-9 bg-gray-200 rounded-full' />
                <div className='h-3 w-12 bg-gray-100 rounded md:hidden' />
              </div>

              <div className='md:col-span-2 flex items-center gap-2'>
                <div className='h-5 w-9 bg-gray-200 rounded-full' />
                <div className='h-3 w-14 bg-gray-100 rounded md:hidden' />
              </div>

              <div className='md:col-span-2 flex items-center gap-2'>
                <div className='h-5 w-9 bg-gray-200 rounded-full' />
                <div className='h-3 w-12 bg-gray-100 rounded md:hidden' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
