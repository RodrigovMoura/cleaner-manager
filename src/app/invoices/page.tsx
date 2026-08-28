import Link from "next/link";
import { getInvoices } from "@/actions/invoice";
import InvoiceActions from "./InvoiceActions";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  // Financial summary calculations
  const pendingTotal = invoices
    .filter((inv) => inv.status === "PENDING")
    .reduce((acc, inv) => acc + Number(inv.amount), 0);

  const paidTotal = invoices.filter((inv) => inv.status === "PAID").reduce((acc, inv) => acc + Number(inv.amount), 0);

  const overdueTotal = invoices
    .filter((inv) => inv.status === "OVERDUE")
    .reduce((acc, inv) => acc + Number(inv.amount), 0);

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6 sm:space-y-8'>
      {/* Header */}
      <div className='flex justify-between items-center pb-2 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Invoices & Billing</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Track payments and manage client billing.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4'>
        <div className='bg-white p-5 rounded-2xl border border-gray-200 shadow-xs'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Pending / Outstanding
          </span>
          <span className='text-2xl sm:text-3xl font-bold text-amber-600'>${pendingTotal.toFixed(2)}</span>
        </div>

        <div className='bg-white p-5 rounded-2xl border border-gray-200 shadow-xs'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Paid Total
          </span>
          <span className='text-2xl sm:text-3xl font-bold text-emerald-600'>${paidTotal.toFixed(2)}</span>
        </div>

        <div className='bg-white p-5 rounded-2xl border border-gray-200 shadow-xs'>
          <span className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'>
            Overdue Total
          </span>
          <span className='text-2xl sm:text-3xl font-bold text-red-600'>${overdueTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className='bg-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center'>
          <span className='text-3xl block mb-2'>📄</span>
          <p className='text-gray-800 font-semibold text-sm sm:text-base mb-1'>No invoices found</p>
          <p className='text-xs sm:text-sm text-gray-400 max-w-sm mx-auto'>
            Invoices are automatically created when scheduled cleanings are marked as completed for clients with the
            invoice toggle enabled.
          </p>
        </div>
      ) : (
        <div className='bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden'>
          <div className='divide-y divide-gray-100'>
            {invoices.map((inv) => {
              const dueDateObj = new Date(inv.dueDate);
              const formattedDueDate = dueDateObj.toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={inv.id}
                  className='p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors'>
                  <div className='space-y-1.5 min-w-0 flex-1'>
                    <div className='flex items-center gap-2.5 flex-wrap'>
                      <span className='font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md'>
                        {inv.invoiceNumber}
                      </span>
                      <Link
                        href={`/clients/${inv.client.id}`}
                        className='font-bold text-sm sm:text-base text-gray-900 hover:text-blue-600 hover:underline truncate'>
                        {inv.client.name}
                      </Link>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : inv.status === "OVERDUE"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                        {inv.status}
                      </span>
                    </div>

                    <p className='text-xs text-gray-500'>
                      Due: <span className='font-semibold text-gray-700'>{formattedDueDate}</span>
                      {inv.paidAt && (
                        <span className='text-emerald-600 ml-2 font-medium'>
                          (Paid on {new Date(inv.paidAt).toLocaleDateString("en-AU")})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className='flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100'>
                    <span className='text-base font-bold text-gray-900 shrink-0'>${Number(inv.amount).toFixed(2)}</span>
                    <div className='flex items-center gap-2'>
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50/60 rounded-lg transition-colors shadow-2xs'>
                        PDF
                      </a>
                      <InvoiceActions
                        invoiceId={inv.id}
                        currentStatus={inv.status}
                        sentAt={inv.sentAt}
                        clientEmail={inv.client.email}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
