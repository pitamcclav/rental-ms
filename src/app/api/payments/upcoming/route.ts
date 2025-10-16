import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { addMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const nextMonth = addMonths(now, 1)

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        payments: {
          orderBy: {
            periodEnd: 'desc',
          },
          take: 1,
        },
      },
    })

    const upcomingPayments = tenants.map((tenant) => {
      const lastPayment = tenant.payments[0]
      
      let nextDueDate: Date
      if (lastPayment) {
        // Next payment is due the day after the last period ended
        nextDueDate = new Date(lastPayment.periodEnd)
        nextDueDate.setDate(nextDueDate.getDate() + 1)
      } else {
        // No payments yet - use start date to calculate next due
        nextDueDate = new Date(tenant.startDate)
      }

      // Check if payment is overdue or upcoming
      const isOverdue = nextDueDate < now
      const isDueThisMonth = nextDueDate >= startOfMonth(now) && nextDueDate <= endOfMonth(now)
      const isDueNextMonth = nextDueDate >= startOfMonth(nextMonth) && nextDueDate <= endOfMonth(nextMonth)

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        unitName: tenant.unit.name,
        unitCode: tenant.unit.code,
        propertyName: tenant.unit.property.name,
        rentAmount: tenant.unit.rentAmount,
        nextDueDate,
        lastPaymentDate: lastPayment?.paymentDate,
        lastPaymentPeriodEnd: lastPayment?.periodEnd,
        isOverdue,
        isDueThisMonth,
        isDueNextMonth,
        daysOverdue: isOverdue ? Math.floor((now.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      }
    })

    // Sort by due date
    upcomingPayments.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())

    return NextResponse.json({
      overdue: upcomingPayments.filter((p) => p.isOverdue),
      dueThisMonth: upcomingPayments.filter((p) => p.isDueThisMonth && !p.isOverdue),
      dueNextMonth: upcomingPayments.filter((p) => p.isDueNextMonth),
      all: upcomingPayments,
    })
  } catch (error) {
    console.error('Error fetching upcoming payments:', error)
    return NextResponse.json({ error: 'Failed to fetch upcoming payments' }, { status: 500 })
  }
}
