'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  MapPin,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateSectionDialog } from './CreateSectionDialog';
import { CreateEnrollmentDialog } from './CreateEnrollmentDialog';

interface UnifiedCourseViewProps {
  semesterId: number | null;
}

export function UnifiedCourseView({ semesterId }: UnifiedCourseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();

  // Fetch unified data (programs with courses and sections)
  const { data: unifiedData = [], isLoading } = useQuery({
    queryKey: ['unified-courses', semesterId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/unified-course-view', {
        params: { semester_id: semesterId }
      });
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
    enabled: !!semesterId
  });

  const toggleProgram = (programId: number) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const toggleCourse = (courseId: number) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const filteredData = unifiedData.filter((program: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      program.name?.toLowerCase().includes(search) ||
      program.code?.toLowerCase().includes(search) ||
      program.courses?.some((course: any) =>
        course.name?.toLowerCase().includes(search) ||
        course.code?.toLowerCase().includes(search)
      )
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        <p className="ml-4 text-gray-600">Loading course structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Offerings</h2>
          <p className="text-gray-500 mt-1">View and manage all courses by program and section</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search programs, courses, or sections..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {/* Unified Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Programme / Course</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Section/Group</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-center">Enrolled/Capacity</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500">No programs found for this semester</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((program: any) => (
                  <>
                    {/* Program Row */}
                    <TableRow key={`program-${program.id}`} className="bg-blue-50 hover:bg-blue-100 font-semibold">
                      <TableCell>
                        <button
                          onClick={() => toggleProgram(program.id)}
                          className="flex items-center gap-2 hover:text-brand-orange transition-colors"
                        >
                          {expandedPrograms.has(program.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="text-blue-900">{program.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {program.code}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell colSpan={5}>
                        <span className="text-sm text-gray-600">
                          {program.course_count || 0} courses
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={program.is_active ? 'default' : 'secondary'}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell />
                    </TableRow>

                    {/* Courses under this Program */}
                    {expandedPrograms.has(program.id) &&
                      program.courses?.map((course: any) => (
                        <>
                          {/* Course Row */}
                          <TableRow key={`course-${course.id}`} className="bg-gray-50">
                            <TableCell className="pl-12">
                              <button
                                onClick={() => toggleCourse(course.id)}
                                className="flex items-center gap-2 hover:text-brand-orange transition-colors"
                              >
                                {expandedCourses.has(course.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{course.name}</span>
                                <span className="text-sm text-gray-500">({course.code})</span>
                              </button>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{course.semester_name || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{course.section_count || 0} sections</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {course.credits} credits
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-center">
                              <div className="text-sm">
                                {course.total_enrolled || 0} / {course.total_capacity || 0}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={course.is_active ? 'default' : 'secondary'}>
                                {course.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setSectionDialogOpen(true);
                                }}
                              >
                                Add Section
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Sections under this Course */}
                          {expandedCourses.has(course.id) &&
                            course.sections?.map((section: any) => (
                              <TableRow key={`section-${section.id}`} className="hover:bg-gray-50">
                                <TableCell className="pl-24">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">Section {section.section_code}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Calendar className="h-3 w-3" />
                                    {section.semester_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-brand-orange text-white">
                                    {section.section_code}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm">
                                    <User className="h-3 w-3 text-gray-400" />
                                    {section.instructor_name || 'Unassigned'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {section.schedule ? (
                                    <div className="space-y-1">
                                      {JSON.parse(section.schedule).map((sch: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                          <Clock className="h-3 w-3" />
                                          <span>{sch.day} {sch.time}</span>
                                          {sch.room && (
                                            <>
                                              <MapPin className="h-3 w-3" />
                                              <span>{sch.room}</span>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : section.room ? (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <MapPin className="h-3 w-3" />
                                      {section.room}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Not scheduled</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center">
                                    <Badge variant={section.enrolled_count >= section.max_students ? 'destructive' : 'outline'}>
                                      {section.enrolled_count || 0} / {section.max_students || 0}
                                    </Badge>
                                    {section.enrolled_count >= section.max_students && (
                                      <span className="text-xs text-red-600 mt-1">Full</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={section.is_active ? 'default' : 'secondary'}>
                                    {section.is_active ? 'Open' : 'Closed'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => router.push(`/sections/${section.id}`)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEnrollmentDialogOpen(true)}
                                    >
                                      Enroll
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      ))}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateSectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        courseId={selectedCourseId}
      />

      <CreateEnrollmentDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
      />
    </div>
  );
}
