"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" | "orange" | "gray"
  size?: "default" | "sm" | "lg"
  children: React.ReactNode
}

const badgeVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  success: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
  purple: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
  orange: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
  gray: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
}

const badgeSizes = {
  default: "px-2.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
}

const Badge = React.forwardRef<
  HTMLDivElement,
  BadgeProps
>(({ className, variant = "default", size = "default", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
      badgeVariants[variant],
      badgeSizes[size],
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Badge.displayName = "Badge"

export { Badge }