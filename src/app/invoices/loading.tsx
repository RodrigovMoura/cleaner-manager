export default function InvoicesLoading() {
  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex justify-between items-center pb-2 border-b border-gray-200'>
        <div className='space-y-2'>
          <div className='h-8 w-44 bg-gray-200 rounded-xl' />
          <div className='h-4 w-60 bg-gray-100 rounded-lg' />
        </div>
      </div>

      {/* Summary KPI Cards Skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2'>
            <div className='h-3 w-28 bg-gray-200 rounded' />
            <div className='h-8 w-28 bg-gray-200 rounded-lg' />
          </div>
        ))}
      </div>

      {/* Invoices List Skeleton */}
      <div className='bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
        <div className='divide-y divide-gray-100'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='space-y-2 min-w-0 flex-1'>
                <div className='flex items-center gap-2.5 flex-wrap'>
                  <div className='h-5 w-20 bg-gray-100 rounded-md' />
                  <div className='h-5 w-36 bg-gray-200 rounded' />
                  <div className='h-4 w-16 bg-gray-100 rounded-full' />
                </div>
                <div className='h-3.5 w-48 bg-gray-100 rounded' />
              </div>

              <div className='flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                <div className='h-5 w-16 bg-gray-200 rounded' />
                <div className='flex items-center gap-2'>
                  <div className='h-7 w-12 bg-gray-100 rounded-lg' />
                  <div className='h-7 w-20 bg-gray-100 rounded-lg' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
