import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not defined in environment variables.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_api_key");
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ana's Cleaning Touch <invoices@anascleaningtouch.com.au>";
export const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || "analuizamelo3m@gmail.com";
