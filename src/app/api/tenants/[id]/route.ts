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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = tenantSchema.parse(body)

    const tenantData = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: tenantData,
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error updating tenant:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get tenant to find unit
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { unit: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Delete tenant
    await prisma.tenant.delete({
      where: { id },
    })

    // Check if unit has any other active tenants
    const remainingTenants = await prisma.tenant.count({
      where: {
        unitId: tenant.unitId,
        status: 'active',
      },
    })

    // Update unit status to vacant if no active tenants
    if (remainingTenants === 0) {
      await prisma.unit.update({
        where: { id: tenant.unitId },
        data: { status: 'vacant' },
      })
    }

    return NextResponse.json({ message: 'Tenant deleted successfully' })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}
