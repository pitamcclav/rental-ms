"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  Receipt, 
  LayoutDashboard,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Properties",
    href: "/properties",
    icon: Building2,
  },
  {
    label: "Units",
    href: "/units",
    icon: Home,
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Users,
  },
  {
    label: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b bg-card flex items-center justify-between px-4 lg:hidden z-50">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Rental MS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-screen w-64 border-r bg-card flex flex-col z-40 transition-transform duration-300",
          "lg:left-0 lg:translate-x-0",
          isMobileMenuOpen ? "left-0 translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo/Brand - Hidden on mobile (shown in header) */}
        <div className="hidden lg:flex items-center gap-2 h-16 px-6 border-b">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Rental MS</span>
        </div>

        {/* Mobile padding to account for header */}
        <div className="h-16 lg:hidden" />

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 Rental MS
          </p>
        </div>
      </aside>
    </>
  )
}
