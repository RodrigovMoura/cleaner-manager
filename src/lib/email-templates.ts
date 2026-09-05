export interface BankPaymentDetails {
  accountName?: string | null;
  bsb?: string | null;
  accountNumber?: string | null;
  payId?: string | null;
}

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDateStr: string;
  bankDetails?: BankPaymentDetails;
}

export function getInvoiceEmailHtml({
  clientName,
  invoiceNumber,
  amount,
  dueDateStr,
  bankDetails,
}: InvoiceEmailProps): string {
  const hasBankDetails = Boolean(bankDetails?.bsb && bankDetails?.accountNumber);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937; line-height: 1.5;">
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px;">Tax Invoice ${invoiceNumber}</h2>
      <p style="font-size: 15px; margin-bottom: 12px;">Hi ${clientName},</p>
      <p style="font-size: 15px; margin-bottom: 20px;">
        Thank you for your business. Please find attached your tax invoice for the recent cleaning service.
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Invoice Number:</td>
            <td style="font-weight: 600; text-align: right; color: #111827;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Amount Due:</td>
            <td style="font-weight: 700; text-align: right; color: #111827;">$${amount.toFixed(2)} AUD</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Due Date:</td>
            <td style="font-weight: 600; text-align: right; color: #111827;">${dueDateStr}</td>
          </tr>
        </table>
      </div>

      ${
        hasBankDetails
          ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase;">How to Pay (Direct Deposit)</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          ${
            bankDetails?.accountName
              ? `<tr><td style="color: #4b5563; padding: 3px 0;">Account Name:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails.accountName}</td></tr>`
              : ""
          }
          <tr><td style="color: #4b5563; padding: 3px 0;">BSB:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails?.bsb}</td></tr>
          <tr><td style="color: #4b5563; padding: 3px 0;">Account Number:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails?.accountNumber}</td></tr>
          ${
            bankDetails?.payId
              ? `<tr><td style="color: #4b5563; padding: 3px 0;">PayID:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails.payId}</td></tr>`
              : ""
          }
          <tr><td style="color: #4b5563; padding: 3px 0;">Reference:</td><td style="font-weight: 700; text-align: right; color: #166534;">${invoiceNumber}</td></tr>
        </table>
      </div>
      `
          : ""
      }

      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        The detailed invoice PDF is attached to this email. If you have any questions, feel free to reply directly to this message.
      </p>
    </div>
  `;
}

// Appointment Reminder Template
interface AppointmentReminderEmailProps {
  clientName: string;
  formattedDate: string;
  formattedTime: string;
  address: string;
}

export function getAppointmentReminderEmailHtml({
  clientName,
  formattedDate,
  formattedTime,
  address,
}: AppointmentReminderEmailProps): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937; line-height: 1.5;">
      <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px;">Cleaning Reminder</h2>
      <p style="font-size: 15px; margin-bottom: 12px;">Hi ${clientName},</p>
      <p style="font-size: 15px; margin-bottom: 20px;">
        This is a friendly reminder that your next cleaning service is scheduled for:
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #166534;">
          📅 ${formattedDate} at ${formattedTime}
        </p>
        <p style="margin: 0; font-size: 13px; color: #374151;">📍 ${address}</p>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        If you need to reschedule or have specific instructions for this visit, please reply directly to this email.
      </p>
    </div>
  `;
}

// Overdue Payment Reminder Template
interface OverduePaymentEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDateStr: string;
  bankDetails?: BankPaymentDetails;
}

export function getOverduePaymentEmailHtml({
  clientName,
  invoiceNumber,
  amount,
  dueDateStr,
  bankDetails,
}: OverduePaymentEmailProps): string {
  const hasBankDetails = Boolean(bankDetails?.bsb && bankDetails?.accountNumber);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937; line-height: 1.5;">
      <h2 style="font-size: 20px; font-weight: 700; color: #b91c1c; margin-bottom: 16px;">Payment Reminder: Invoice ${invoiceNumber}</h2>
      <p style="font-size: 15px; margin-bottom: 12px;">Hi ${clientName},</p>
      <p style="font-size: 15px; margin-bottom: 20px;">
        This is a friendly notice that invoice <strong>${invoiceNumber}</strong> was due on <strong>${dueDateStr}</strong> and is currently marked as pending payment.
      </p>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Outstanding Balance:</td>
            <td style="font-weight: 700; text-align: right; color: #b91c1c;">$${amount.toFixed(2)} AUD</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Original Due Date:</td>
            <td style="font-weight: 600; text-align: right; color: #111827;">${dueDateStr}</td>
          </tr>
        </table>
      </div>

      ${
        hasBankDetails
          ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase;">Direct Bank Transfer Details</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          ${
            bankDetails?.accountName
              ? `<tr><td style="color: #4b5563; padding: 3px 0;">Account Name:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails.accountName}</td></tr>`
              : ""
          }
          <tr><td style="color: #4b5563; padding: 3px 0;">BSB:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails?.bsb}</td></tr>
          <tr><td style="color: #4b5563; padding: 3px 0;">Account Number:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails?.accountNumber}</td></tr>
          ${
            bankDetails?.payId
              ? `<tr><td style="color: #4b5563; padding: 3px 0;">PayID:</td><td style="font-weight: 600; text-align: right; color: #111827;">${bankDetails.payId}</td></tr>`
              : ""
          }
          <tr><td style="color: #4b5563; padding: 3px 0;">Reference:</td><td style="font-weight: 700; text-align: right; color: #166534;">${invoiceNumber}</td></tr>
        </table>
      </div>
      `
          : ""
      }

      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        If you have already processed this payment, please disregard this reminder. Feel free to reply directly if you have any questions.
      </p>
    </div>
  `;
}
