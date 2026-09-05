import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserBankDetails } from "@/actions/settings";
import SettingsForm from "./SettingsForm";

export const metadata = {
  title: "Settings | Cleaner Manager",
  description: "Configure Australian bank transfer details and invoice preferences.",
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const user = await getUserBankDetails();

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 space-y-6'>
      {/* Header */}
      <div className='pb-4 border-b border-gray-200'>
        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>Settings</h1>
        <p className='text-xs sm:text-sm text-gray-500 mt-1'>
          Manage your business profile, Australian bank payment details, and billing instructions.
        </p>
      </div>

      <SettingsForm initialData={user} />
    </div>
  );
}
