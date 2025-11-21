 "use client";

import { usePathname } from 'next/navigation';
import { generateBreadcrumbs, getPageTitle, getPageSubtitle } from '@/lib/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              {finalBreadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === finalBreadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={breadcrumb.href || "#"}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
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