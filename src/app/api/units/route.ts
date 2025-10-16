import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const unitSchema = z.object({
  code: z.string().optional(), // Auto-generated if not provided
  name: z.string().min(1, 'Unit name is required'),
  propertyId: z.string().min(1, 'Property is required'),
  rentAmount: z.number().positive('Rent amount must be positive'),
  status: z.enum(['vacant', 'occupied']).default('vacant'),
})

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      include: {
        property: true,
        tenants: {
          where: {
            status: 'active',
          },
        },
        _count: {
          select: {
            tenants: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = unitSchema.parse(body)

    // Auto-generate code if not provided
    let code = validatedData.code
    if (!code) {
      // Get the last unit to determine next code
      const lastUnit = await prisma.unit.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { code: true },
      })

      if (lastUnit) {
        // Extract number from code like "UNIT-0001" and increment
        const match = lastUnit.code.match(/UNIT-(\d+)/)
        const nextNum = match ? parseInt(match[1]) + 1 : 1
        code = `UNIT-${nextNum.toString().padStart(4, '0')}`
      } else {
        code = 'UNIT-0001'
      }
    }

    const unit = await prisma.unit.create({
      data: {
        ...validatedData,
        code,
      },
      include: {
        property: true,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating unit:', error)
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 })
  }
}
