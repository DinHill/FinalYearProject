"use client";

import { useState } from "react";
import { X, Filter, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: "single" | "multi" | "date";
  options: FilterOption[];
}

interface ActiveFilter {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
  value: string;
}

interface FilterBarProps {
  filters: FilterGroup[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showSearch = true,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(searchValue);

  const handleFilterToggle = (groupId: string, option: FilterOption, type: "single" | "multi" | "date") => {
    let newFilters = [...activeFilters];

    const existingFilterIndex = newFilters.findIndex(
      f => f.groupId === groupId && f.optionId === option.id
    );

    if (existingFilterIndex >= 0) {
      // Remove filter
      newFilters.splice(existingFilterIndex, 1);
    } else {
      // Add filter
      const group = filters.find(f => f.id === groupId);
      if (!group) return;

      if (type === "single" || type === "date") {
        // Remove any existing filters for this group
        newFilters = newFilters.filter(f => f.groupId !== groupId);
      }

      newFilters.push({
        groupId,
        groupLabel: group.label,
        optionId: option.id,
        optionLabel: option.label,
        value: option.value,
      });
    }

    onFilterChange(newFilters);
  };

  const removeFilter = (filterToRemove: ActiveFilter) => {
    const newFilters = activeFilters.filter(
      f => !(f.groupId === filterToRemove.groupId && f.optionId === filterToRemove.optionId)
    );
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
    setSearchInput("");
    onSearchChange?.("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchInput);
  };

  const isFilterActive = (groupId: string, optionId: string) => {
    return activeFilters.some(f => f.groupId === groupId && f.optionId === optionId);
  };

  const getActiveFilterCount = (groupId: string) => {
    return activeFilters.filter(f => f.groupId === groupId).length;
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 py-4 space-y-4">
        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full max-w-md pl-4 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </form>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          {/* Filter Dropdowns */}
          {filters.map((group) => {
            const activeCount = getActiveFilterCount(group.id);
            
            return (
              <DropdownMenu key={group.id}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1 ${activeCount > 0 ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {group.label}
                    {activeCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {activeCount}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {group.type === "date" ? (
                    <div className="p-2">
                      <div className="text-sm text-muted-foreground mb-2">Date range filters coming soon</div>
                    </div>
                  ) : (
                    group.options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.id}
                        checked={isFilterActive(group.id, option.id)}
                        onCheckedChange={() => handleFilterToggle(group.id, option, group.type)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {/* Clear All */}
          {(activeFilters.length > 0 || searchInput) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active:</span>
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.groupId}-${filter.optionId}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-xs text-muted-foreground">
                  {filter.groupLabel}:
                </span>
                {filter.optionLabel}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter)}
                  className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}