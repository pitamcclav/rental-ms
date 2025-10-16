import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, Users, DollarSign } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [propertyCount, unitCount, tenantCount, recentPayments] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.tenant.count({ where: { status: 'active' } }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: {
        tenant: true,
        unit: { include: { property: true } },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your rental management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertyCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPayments.length}</div>
            <p className="text-xs text-muted-foreground">Last 5 payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{payment.tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.unit.property.name} - {payment.unit.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${payment.amount.toString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link href="/payments">
              <Button variant="outline" size="sm" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                View All Payments
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/properties">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Building2 className="h-6 w-6" />
              <span>Manage Properties</span>
            </Button>
          </Link>
          <Link href="/tenants">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Manage Tenants</span>
            </Button>
          </Link>
          <Link href="/payments">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span>Record Payment</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
