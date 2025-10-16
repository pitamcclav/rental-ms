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
import { Plus, Pencil, Trash2, Home } from "lucide-react"
import { toast } from "sonner"

type Unit = {
  id: string
  code: string
  name: string
  propertyId: string
  property: { id: string; name: string }
  rentAmount: number
  status: string
  _count?: { tenants: number; payments: number }
}

type Property = {
  id: string
  name: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    propertyId: "",
    rentAmount: "",
    status: "vacant",
  })

  useEffect(() => {
    fetchUnits()
    fetchProperties()
  }, [])

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/units")
      const data = await response.json()
      setUnits(data)
    } catch (error) {
      toast.error("Failed to fetch units")
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties")
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      toast.error("Failed to fetch properties")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUnit ? `/api/units/${editingUnit.id}` : "/api/units"
      
      const response = await fetch(url, {
        method: editingUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount),
        }),
      })

      if (!response.ok) throw new Error("Failed to save unit")

      toast.success(editingUnit ? "Unit updated" : "Unit created")
      setDialogOpen(false)
      resetForm()
      fetchUnits()
    } catch (error) {
      toast.error("Failed to save unit")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete unit")

      toast.success("Unit deleted")
      fetchUnits()
    } catch (error) {
      toast.error("Failed to delete unit")
    }
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      code: unit.code,
      name: unit.name,
      propertyId: unit.propertyId,
      rentAmount: unit.rentAmount.toString(),
      status: unit.status,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingUnit(null)
    setFormData({
      code: "",
      name: "",
      propertyId: "",
      rentAmount: "",
      status: "vacant",
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
            <Home className="h-8 w-8" />
            Units
          </h1>
          <p className="text-muted-foreground">Manage rental units across properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Edit" : "Add"} Unit</DialogTitle>
                <DialogDescription>
                  {editingUnit ? "Update" : "Create a new"} unit details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select
                    value={formData.propertyId}
                    onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Unit Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., A101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Unit Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Apartment 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Monthly Rent</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    placeholder="e.g., 1200.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingUnit ? "Update" : "Create"} Unit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Units</CardTitle>
          <CardDescription>A list of all rental units</CardDescription>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No units found. Add your first unit to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Tenants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.code}</TableCell>
                    <TableCell>{unit.name}</TableCell>
                    <TableCell className="text-muted-foreground">{unit.property.name}</TableCell>
                    <TableCell>${unit.rentAmount.toString()}</TableCell>
                    <TableCell>
                      <Badge variant={unit.status === "occupied" ? "default" : "secondary"}>
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{unit._count?.tenants || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
