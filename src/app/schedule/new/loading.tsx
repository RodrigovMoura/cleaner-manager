export default function NewScheduleLoading() {
  return (
    <div className='max-w-2xl mx-auto p-4 sm:p-6 text-gray-900 animate-pulse space-y-6'>
      {/* Header Skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1.5'>
          <div className='h-8 w-48 bg-gray-200 rounded-xl' />
          <div className='h-4 w-64 bg-gray-100 rounded-lg' />
        </div>
        <div className='h-8 w-18 bg-gray-200 rounded-lg' />
      </div>

      {/* Main Form Card Skeleton */}
      <div className='bg-white border border-gray-200 shadow-xs rounded-xl p-5 sm:p-7 space-y-6'>
        {/* Client Selection */}
        <div className='space-y-1.5'>
          <div className='h-3.5 w-20 bg-gray-200 rounded' />
          <div className='h-10 w-full bg-gray-100 rounded-lg' />
        </div>

        {/* Date and Time */}
        <div className='space-y-1.5'>
          <div className='h-3.5 w-24 bg-gray-200 rounded' />
          <div className='h-10 w-full bg-gray-100 rounded-lg' />
        </div>

        {/* Price */}
        <div className='space-y-1.5'>
          <div className='h-3.5 w-20 bg-gray-200 rounded' />
          <div className='h-10 w-full bg-gray-100 rounded-lg' />
        </div>

        {/* Recurrence Section */}
        <div className='space-y-2 pt-2 border-t border-gray-100'>
          <div className='h-3.5 w-28 bg-gray-200 rounded' />
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
            <div className='h-10 bg-gray-100 rounded-lg' />
            <div className='h-10 bg-gray-100 rounded-lg' />
            <div className='h-10 bg-gray-100 rounded-lg' />
            <div className='h-10 bg-gray-100 rounded-lg' />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-100'>
          <div className='h-10 w-20 bg-gray-100 rounded-lg' />
          <div className='h-10 w-36 bg-gray-200 rounded-lg' />
        </div>
      </div>
    </div>
  );
}
