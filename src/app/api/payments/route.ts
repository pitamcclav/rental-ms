import { prisma } from '@/lib/prisma'
import { sendPaymentReceipt } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addMonths } from 'date-fns'

const paymentSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  unitId: z.string().min(1, 'Unit is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  monthsCovered: z.number().int().positive('Months covered must be at least 1'),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tenantId = searchParams.get('tenantId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (tenantId) where.tenantId = tenantId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Get tenant to calculate period based on start date
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const paymentDate = new Date(validatedData.paymentDate)
    
    // Calculate period start and end based on tenant's start date and months covered
    // Find the last payment to determine the next period start
    const lastPayment = await prisma.payment.findFirst({
      where: { tenantId: validatedData.tenantId },
      orderBy: { periodEnd: 'desc' },
    })

    let periodStart: Date
    if (lastPayment) {
      // Start from the day after the last payment period ended
      periodStart = new Date(lastPayment.periodEnd)
      periodStart.setDate(periodStart.getDate() + 1)
    } else {
      // First payment - start from tenant's start date
      periodStart = new Date(tenant.startDate)
    }

    const periodEnd = addMonths(periodStart, validatedData.monthsCovered)
    periodEnd.setDate(periodEnd.getDate() - 1) // End is inclusive

    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        paymentDate,
        periodStart,
        periodEnd,
        status: 'completed',
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
    })

    // Send email receipt
    const emailResult = await sendPaymentReceipt(payment)
    
    // Update payment to mark receipt as sent
    if (emailResult.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { receiptSent: true },
      })
    }

    return NextResponse.json({
      ...payment,
      receiptSent: emailResult.success,
      emailError: emailResult.success ? undefined : 'Failed to send receipt email',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
