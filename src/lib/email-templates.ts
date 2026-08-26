interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDateStr: string;
}

export function getInvoiceEmailHtml({ clientName, invoiceNumber, amount, dueDateStr }: InvoiceEmailProps): string {
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

      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        The detailed invoice PDF is attached to this email. If you have any questions, feel free to reply directly to this message.
      </p>
    </div>
  `;
}
