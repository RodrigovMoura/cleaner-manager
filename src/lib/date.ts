/**
 * Date and time helper utilities for the application.
 */

/**
 * Formats a Date object or ISO date string into YYYY-MM-DDTHH:mm format
 * compatible with HTML `<input type="datetime-local" />`, using the client's local timezone.
 */
export function formatToDateTimeLocal(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
