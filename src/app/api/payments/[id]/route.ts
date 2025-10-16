import { prisma } from '@/lib/prisma'
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    const paymentDate = new Date(validatedData.paymentDate)
    
    // Get tenant for calculations
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Recalculate periods
    const lastPayment = await prisma.payment.findFirst({
      where: { 
        tenantId: validatedData.tenantId,
        id: { not: id },
      },
      orderBy: { periodEnd: 'desc' },
    })

    let periodStart: Date
    if (lastPayment) {
      periodStart = new Date(lastPayment.periodEnd)
      periodStart.setDate(periodStart.getDate() + 1)
    } else {
      periodStart = new Date(tenant.startDate)
    }

    const periodEnd = addMonths(periodStart, validatedData.monthsCovered)
    periodEnd.setDate(periodEnd.getDate() - 1)

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...validatedData,
        paymentDate,
        periodStart,
        periodEnd,
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

    return NextResponse.json(payment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.payment.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
