import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const tenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  unitId: z.string().min(1, 'Unit is required'),
  startDate: z.string().min(1, 'Start date is required'),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = tenantSchema.parse(body)

    // Convert startDate string to Date
    const tenantData = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
    }

    const tenant = await prisma.tenant.create({
      data: tenantData,
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    })

    // Update unit status to occupied
    await prisma.unit.update({
      where: { id: validatedData.unitId },
      data: { status: 'occupied' },
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}
