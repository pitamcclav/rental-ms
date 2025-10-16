"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"
import { toast } from "sonner"

type Property = {
  id: string
  code: string
  name: string
  address: string
  description: string | null
  createdAt: string
  _count?: {
    units: number
    expenses: number
  }
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    description: "",
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties")
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      toast.error("Failed to fetch properties")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingProperty
        ? `/api/properties/${editingProperty.id}`
        : "/api/properties"
      
      const response = await fetch(url, {
        method: editingProperty ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save property")

      toast.success(editingProperty ? "Property updated" : "Property created")
      setDialogOpen(false)
      resetForm()
      fetchProperties()
    } catch (error) {
      toast.error("Failed to save property")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete property")

      toast.success("Property deleted")
      fetchProperties()
    } catch (error) {
      toast.error("Failed to delete property")
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      code: property.code,
      name: property.name,
      address: property.address,
      description: property.description || "",
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingProperty(null)
    setFormData({
      code: "",
      name: "",
      address: "",
      description: "",
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
            <Building2 className="h-8 w-8" />
            Properties
          </h1>
          <p className="text-muted-foreground">Manage your rental properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProperty ? "Edit" : "Add"} Property</DialogTitle>
                <DialogDescription>
                  {editingProperty ? "Update" : "Create a new"} property details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Property Code (Optional)</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Leave blank to auto-generate (e.g., PROP-0001)"
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated if left blank</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sunrise Apartments"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Main St, City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Property description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingProperty ? "Update" : "Create"} Property
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>A list of all your properties</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No properties found. Add your first property to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-center">Units</TableHead>
                  <TableHead className="text-center">Expenses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.code}</TableCell>
                    <TableCell>{property.name}</TableCell>
                    <TableCell className="text-muted-foreground">{property.address}</TableCell>
                    <TableCell className="text-center">{property._count?.units || 0}</TableCell>
                    <TableCell className="text-center">{property._count?.expenses || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(property)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
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
