"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className={cn("bg-card rounded-xl border", className)}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border shadow-sm", className)}>
      {/* Header with search */}
      {searchable && (
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-6 py-4 text-left text-sm font-medium text-muted-foreground",
                    column.sortable && "cursor-pointer hover:text-foreground",
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 text-sm">
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] || "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination info */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {sortedData.length} of {data.length} results
            {searchTerm && ` for "${searchTerm}"`}
          </span>
        </div>
      </div>
    </div>
  );
}