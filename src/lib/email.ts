import nodemailer from 'nodemailer'
import type { Payment, Tenant, Unit } from '@prisma/client'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number.parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

type PaymentWithRelations = Payment & {
  tenant: Tenant
  unit: Unit & {
    property: {
      name: string
    }
  }
}

export async function sendPaymentReceipt(payment: PaymentWithRelations) {
  const { tenant, unit, amount, paymentDate, periodStart, periodEnd, reference } = payment

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(paymentDate))

  const formattedPeriodStart = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(periodStart))

  const formattedPeriodEnd = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(periodEnd))

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@rentalms.com',
    to: tenant.email,
    subject: 'Payment Receipt - Rental Management System',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .receipt-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #1e3a8a; }
            .amount { font-size: 24px; color: #10b981; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Receipt</h1>
            </div>
            <div class="content">
              <p>Dear ${tenant.name},</p>
              <p>Thank you for your payment. This is to confirm that we have received your rent payment.</p>
              
              <div class="receipt-details">
                <div class="detail-row">
                  <span class="detail-label">Receipt Number:</span>
                  <span>${reference || payment.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Date:</span>
                  <span>${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Property:</span>
                  <span>${unit.property.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Unit:</span>
                  <span>${unit.name} (${unit.code})</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Period:</span>
                  <span>${formattedPeriodStart} - ${formattedPeriodEnd}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Months Covered:</span>
                  <span>${payment.monthsCovered} month(s)</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount Paid:</span>
                  <span class="amount">${formattedAmount}</span>
                </div>
              </div>

              <p>If you have any questions about this payment, please contact us.</p>
              <p>Best regards,<br>Rental Management Team</p>
            </div>
            <div class="footer">
              <p>This is an automated receipt. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
