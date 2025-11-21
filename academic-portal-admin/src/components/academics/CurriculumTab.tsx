'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UnifiedCourseViewEnhanced } from './UnifiedCourseViewEnhanced';

interface CurriculumTabProps {
  semesterId: number | null;
}

export function CurriculumTab({ semesterId }: CurriculumTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#003366]">Curriculum Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Unified view: Manage programs, courses, sections, and enrollments. Click rows to view details, use expand/collapse to navigate hierarchy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/programs/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/courses/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>

      {/* Unified view with all functionality */}
      <UnifiedCourseViewEnhanced semesterId={semesterId} />
    </div>
  );
}
