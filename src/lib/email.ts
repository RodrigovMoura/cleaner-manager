import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not defined in environment variables.");
}

function cleanEmailString(val?: string): string {
  if (!val) return "";
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_api_key");
export const FROM_EMAIL =
  cleanEmailString(process.env.RESEND_FROM_EMAIL) || "Ana's Cleaning Touch <invoices@anascleaningtouch.com.au>";
export const REPLY_TO_EMAIL = cleanEmailString(process.env.RESEND_REPLY_TO) || "analuizamelo3m@gmail.com";
