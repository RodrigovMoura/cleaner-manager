import Link from "next/link";
import { getAppointments } from "@/actions/appointment";
import ScheduleView, { SerializedAppointment } from "./ScheduleView";

interface SchedulePageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab === "history" ? "history" : "upcoming";
  const rawPage = parseInt(resolvedParams?.page || "1", 10);
  const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const PAGE_SIZE = 8;
  const allAppointments = await getAppointments(currentTab);
  const totalItems = allAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const paginatedAppointments: SerializedAppointment[] = allAppointments
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .map((apt) => ({
      id: apt.id,
      clientId: apt.clientId,
      date: typeof apt.date === "string" ? apt.date : apt.date.toISOString(),
      price: Number(apt.price),
      status: apt.status,
      client: {
        id: apt.client.id,
        name: apt.client.name,
        address: apt.client.address,
      },
    }));

  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Schedule</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>
            Manage upcoming cleanings and review completed history.
          </p>
        </div>
        <Link
          href='/schedule/new'
          className='inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs self-start sm:self-auto'>
          <span>＋</span>
          <span>Schedule Cleaning</span>
        </Link>
      </div>

      {/* Schedule Tabs, List, Loading Indicator, and Pagination */}
      <ScheduleView
        appointments={paginatedAppointments}
        currentTab={currentTab}
        currentPage={currentPage}
        totalItems={totalItems}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
