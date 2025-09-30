"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const variantStyles = {
  default: {
    card: "border-border",
    icon: "text-primary bg-primary/10",
    value: "text-foreground",
  },
  success: {
    card: "border-green-200 bg-green-50/50",
    icon: "text-green-600 bg-green-100",
    value: "text-green-700",
  },
  warning: {
    card: "border-yellow-200 bg-yellow-50/50",
    icon: "text-yellow-600 bg-yellow-100",
    value: "text-yellow-700",
  },
  danger: {
    card: "border-red-200 bg-red-50/50",
    icon: "text-red-600 bg-red-100",
    value: "text-red-700",
  },
  info: {
    card: "border-blue-200 bg-blue-50/50",
    icon: "text-blue-600 bg-blue-100",
    value: "text-blue-700",
  },
  purple: {
    card: "border-purple-200 bg-purple-50/50",
    icon: "text-purple-600 bg-purple-100",
    value: "text-purple-700",
  },
};

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-green-600 bg-green-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md group",
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  getTrendColor(trend.direction)
                )}
              >
                {getTrendIcon(trend.direction)}
                <span className="ml-1">
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
              </div>
            )}
          </div>
          {(description || trend?.label) && (
            <p className="text-sm text-muted-foreground mt-2">
              {trend?.label || description}
            </p>
          )}
        </div>
        
        {Icon && (
          <div
            className={cn(
              "p-3 rounded-xl transition-all duration-200 group-hover:scale-110",
              styles.icon
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] rounded-xl pointer-events-none" />
    </div>
  );
}