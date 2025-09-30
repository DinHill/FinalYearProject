"use client";

import { ChevronRight } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { generateBreadcrumbs, getPageTitle, getPageSubtitle } from '@/lib/navigation';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  customContent?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions, 
  customContent 
}: PageHeaderProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs and title if not provided
  const finalBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname);
  const finalTitle = title || getPageTitle(pathname);
  const finalSubtitle = subtitle || getPageSubtitle(pathname);

  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {finalBreadcrumbs && finalBreadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
            {finalBreadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                {breadcrumb.href ? (
                  <Link
                    href={breadcrumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className={index === finalBreadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                    {breadcrumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Custom content or Title and Actions */}
        {customContent ? (
          customContent
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{finalTitle}</h1>
              {finalSubtitle && (
                <p className="text-muted-foreground mt-1">{finalSubtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}