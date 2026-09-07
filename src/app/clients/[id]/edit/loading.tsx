export default function EditClientLoading() {
  return (
    <div className='max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 relative space-y-6 animate-pulse'>
      {/* Header Skeleton */}
      <div className='flex items-center justify-between pb-2 border-b border-gray-200'>
        <div className='space-y-1.5'>
          <div className='h-8 w-36 bg-gray-200 rounded-xl' />
          <div className='h-4 w-64 bg-gray-100 rounded-lg' />
        </div>
        <div className='h-9 w-20 bg-gray-200 rounded-xl shrink-0' />
      </div>

      <div className='space-y-6'>
        {/* Contact Information Card Skeleton */}
        <div className='bg-white p-5 sm:p-7 border border-gray-200 rounded-2xl shadow-xs space-y-5'>
          <div className='h-3 w-36 bg-gray-200 rounded' />

          <div className='space-y-4'>
            {/* Name */}
            <div className='space-y-1.5'>
              <div className='h-3.5 w-24 bg-gray-200 rounded' />
              <div className='h-10 w-full bg-gray-100 rounded-xl' />
            </div>

            {/* Email & Phone Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <div className='h-3.5 w-24 bg-gray-200 rounded' />
                <div className='h-10 w-full bg-gray-100 rounded-xl' />
              </div>
              <div className='space-y-1.5'>
                <div className='h-3.5 w-24 bg-gray-200 rounded' />
                <div className='h-10 w-full bg-gray-100 rounded-xl' />
              </div>
            </div>

            {/* Address */}
            <div className='space-y-1.5'>
              <div className='h-3.5 w-20 bg-gray-200 rounded' />
              <div className='h-10 w-full bg-gray-100 rounded-xl' />
            </div>
          </div>
        </div>

        {/* Automation Preferences Card Skeleton */}
        <div className='bg-white p-5 sm:p-7 border border-gray-200 rounded-2xl shadow-xs space-y-5'>
          <div className='h-3 w-48 bg-gray-200 rounded' />

          {/* Appointment Reminders */}
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <div className='h-4 w-44 bg-gray-200 rounded' />
                <div className='h-3 w-64 bg-gray-100 rounded' />
              </div>
              <div className='h-5 w-5 bg-gray-200 rounded-md shrink-0' />
            </div>
            <div className='pl-3.5 border-l-2 border-gray-200 space-y-1'>
              <div className='h-3 w-24 bg-gray-100 rounded' />
              <div className='h-8 w-32 bg-gray-100 rounded-lg' />
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Invoices */}
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <div className='h-4 w-36 bg-gray-200 rounded' />
                <div className='h-3 w-72 bg-gray-100 rounded' />
              </div>
              <div className='h-5 w-5 bg-gray-200 rounded-md shrink-0' />
            </div>
            <div className='flex items-start justify-between gap-3 pl-3.5 border-l-2 border-gray-200'>
              <div className='space-y-1'>
                <div className='h-3.5 w-40 bg-gray-200 rounded' />
                <div className='h-3 w-64 bg-gray-100 rounded' />
              </div>
              <div className='h-4 w-4 bg-gray-200 rounded shrink-0' />
            </div>
          </div>

          <hr className='border-gray-100' />

          {/* Payment Reminders */}
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1'>
              <div className='h-4 w-48 bg-gray-200 rounded' />
              <div className='h-3 w-72 bg-gray-100 rounded' />
            </div>
            <div className='h-5 w-5 bg-gray-200 rounded-md shrink-0' />
          </div>
        </div>

        {/* Footer Actions Skeleton (Delete on left, Cancel & Save on right) */}
        <div className='flex items-center justify-between pt-2'>
          <div className='h-10 w-28 bg-red-100/70 rounded-xl' />
          <div className='flex items-center gap-3'>
            <div className='h-10 w-20 bg-gray-200 rounded-xl' />
            <div className='h-10 w-32 bg-gray-200 rounded-xl' />
          </div>
        </div>
      </div>
    </div>
  );
}
