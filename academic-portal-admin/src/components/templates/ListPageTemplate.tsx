import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface ListPageTemplateProps {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  onCreate?: () => void;
  createButtonText?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ListPageTemplate({
  title,
  description,
  searchPlaceholder = 'Search...',
  onSearch,
  onFilter,
  onExport,
  onCreate,
  createButtonText = 'Create New',
  children,
  actions,
}: ListPageTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {createButtonText}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          {onSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}

          {/* Filter */}
          {onFilter && (
            <Button variant="outline" onClick={onFilter} className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
