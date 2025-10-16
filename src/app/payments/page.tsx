"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, DollarSign, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

type Payment = {
  id: string
  tenantId: string
  tenant: { name: string }
  unitId: string
  unit: { name: string; property: { name: string } }
  amount: number
  paymentDate: string
  periodStart: string
  periodEnd: string
  monthsCovered: number
  paymentMethod: string | null
  reference: string | null
}

type Tenant = {
  id: string
  name: string
  unit: { id: string; name: string; rentAmount: number }
}

type UpcomingPayment = {
  tenantId: string
  tenantName: string
  unitName: string
  propertyName: string
  rentAmount: number
  nextDueDate: string
  isOverdue: boolean
  daysOverdue: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<{ overdue: UpcomingPayment[]; dueThisMonth: UpcomingPayment[] }>({ overdue: [], dueThisMonth: [] })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tenantId: "",
    unitId: "",
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    monthsCovered: "1",
    paymentMethod: "",
    reference: "",
  })

  useEffect(() => {
    fetchPayments()
    fetchTenants()
    fetchUpcomingPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments")
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      toast.error("Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants")
      const data = await response.json()
      setTenants(data.filter((t: Tenant) => t.unit))
    } catch (error) {
      toast.error("Failed to fetch tenants")
    }
  }

  const fetchUpcomingPayments = async () => {
    try {
      const response = await fetch("/api/payments/upcoming")
      const data = await response.json()
      setUpcomingPayments(data)
    } catch (error) {
      console.error("Failed to fetch upcoming payments")
    }
  }

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    if (tenant) {
      setFormData({
        ...formData,
        tenantId,
        unitId: tenant.unit.id,
        amount: tenant.unit.rentAmount.toString(),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          monthsCovered: parseInt(formData.monthsCovered),
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error("Failed to record payment")

      toast.success(data.emailError ? `Payment recorded (${data.emailError})` : "Payment recorded and receipt sent")
      setDialogOpen(false)
      resetForm()
      fetchPayments()
      fetchUpcomingPayments()
    } catch (error) {
      toast.error("Failed to record payment")
    }
  }

  const resetForm = () => {
    setFormData({
      tenantId: "",
      unitId: "",
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      monthsCovered: "1",
      paymentMethod: "",
      reference: "",
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Payments
          </h1>
          <p className="text-muted-foreground">Track rent payments and upcoming due dates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Record a new rent payment and send receipt via email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select
                    value={formData.tenantId}
                    onValueChange={handleTenantChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} - {tenant.unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 1200.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthsCovered">Months Covered</Label>
                  <Input
                    id="monthsCovered"
                    type="number"
                    min="1"
                    value={formData.monthsCovered}
                    onChange={(e) => setFormData({ ...formData, monthsCovered: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
                  <Input
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="e.g., Cash, Bank Transfer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number (Optional)</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="e.g., TXN123456"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Record Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcomingPayments.dueThisMonth.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingPayments.dueThisMonth.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue
            {upcomingPayments.overdue.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {upcomingPayments.overdue.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All recorded payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payments recorded yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Months</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenant.name}</TableCell>
                        <TableCell>{payment.unit.name}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(payment.amount.toString())}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">{payment.monthsCovered}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>Payments due this month</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPayments.dueThisMonth.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming payments this month.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPayments.dueThisMonth.map((payment) => (
                      <TableRow key={payment.tenantId}>
                        <TableCell className="font-medium">{payment.tenantName}</TableCell>
                        <TableCell>{payment.unitName}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.propertyName}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(payment.rentAmount.toString())}</TableCell>
                        <TableCell>{new Date(payment.nextDueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Overdue Payments
              </CardTitle>
              <CardDescription>Payments that are past due</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPayments.overdue.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No overdue payments.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPayments.overdue.map((payment) => (
                      <TableRow key={payment.tenantId}>
                        <TableCell className="font-medium">{payment.tenantName}</TableCell>
                        <TableCell>{payment.unitName}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.propertyName}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(payment.rentAmount.toString())}</TableCell>
                        <TableCell>{new Date(payment.nextDueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {payment.daysOverdue} days overdue
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
