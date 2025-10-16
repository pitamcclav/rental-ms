import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const propertySchema = z.object({
  code: z.string().optional(), // Auto-generated if not provided
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        units: {
          include: {
            tenants: {
              where: {
                status: 'active',
              },
            },
          },
        },
        _count: {
          select: {
            units: true,
            expenses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = propertySchema.parse(body)

    // Auto-generate code if not provided
    let code = validatedData.code
    if (!code) {
      // Get the last property to determine next code
      const lastProperty = await prisma.property.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { code: true },
      })

      if (lastProperty) {
        // Extract number from code like "PROP-0001" and increment
        const match = lastProperty.code.match(/PROP-(\d+)/)
        const nextNum = match ? parseInt(match[1]) + 1 : 1
        code = `PROP-${nextNum.toString().padStart(4, '0')}`
      } else {
        code = 'PROP-0001'
      }
    }

    const property = await prisma.property.create({
      data: {
        ...validatedData,
        code,
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating property:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
