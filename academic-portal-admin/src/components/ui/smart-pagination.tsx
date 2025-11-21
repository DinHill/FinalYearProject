import React from 'react';
import { Button } from './button';
import { cn } from './utils';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemName: string; // e.g., "users", "grades", "files"
  onPageChange: (page: number) => void;
  className?: string;
}

export function SmartPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemName,
  onPageChange,
  className,
}: SmartPaginationProps) {
  const start = ((currentPage - 1) * itemsPerPage) + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page)}
          className={cn(
            currentPage === page && "bg-primary text-primary-foreground"
          )}
        >
          {page}
        </Button>
      ));
    }

    // Abbreviated pagination with ellipsis for 8+ pages
    const pages: Array<number | string> = [];

    // Always show first page
    pages.push(1);

    // Show ellipsis if current page is more than 3 pages from start
    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Show ellipsis if current page is more than 2 pages from end
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} className="text-sm text-muted-foreground px-2">
            ...
          </span>
        );
      }

      return (
        <Button
          key={page}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page as number)}
          className={cn(
            currentPage === page && "bg-primary text-primary-foreground"
          )}
        >
          {page}
        </Button>
      );
    });
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between mt-4", className)}>
      <p className="text-sm text-muted-foreground">
        Showing {start}-{end} of {totalItems} {itemName}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {renderPageNumbers()}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
