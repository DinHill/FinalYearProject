'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  Plus,
  Eye,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateSectionDialog } from './CreateSectionDialog';
import { CreateEnrollmentDialog } from './CreateEnrollmentDialog';
import { DetailPanel } from './DetailPanel';

interface UnifiedCourseViewProps {
  semesterId: number | null;
}

type SelectedDetail =
  | {
      type: 'program' | 'course' | 'section';
      id: number;
    }
  | null;

export function UnifiedCourseViewWithDetails({ semesterId }: UnifiedCourseViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail>(null);

  // Fetch unified data (programs with courses and sections)
  const { data: unifiedData = [], isLoading } = useQuery({
    queryKey: ['unified-courses', semesterId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/unified-course-view', {
        params: { semester_id: semesterId }
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch unified course data');
      }
      return response.data;
    },
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

  const handleOpenSectionDialog = (courseId: number) => {
    setSelectedCourseId(courseId);
    setSectionDialogOpen(true);
  };

  const handleOpenEnrollmentDialog = (courseId: number) => {
    setSelectedCourseId(courseId);
    setEnrollmentDialogOpen(true);
  };

  // Filter data based on search
  const filteredData = unifiedData.filter((program: any) => {
    const programMatch = program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        program.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (programMatch) return true;

    return program.courses?.some((course: any) => {
      const courseMatch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (courseMatch) return true;

      return course.sections?.some((section: any) => 
        section.section_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-4 h-[calc(100vh-12rem)] ${selectedDetail ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
        {/* Main Content - Unified Table */}
        <Card className={selectedDetail ? 'lg:col-span-3' : 'col-span-1'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Courses Overview</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search programs, courses, sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[calc(100vh-18rem)]">
            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No results found' : 'No programs available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programme / Course / Section</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((program: any) => {
                    const isExpanded = expandedPrograms.has(program.id);
                    
                    return (
                      <React.Fragment key={`program-${program.id}`}>
                        {/* Program Row */}
                        <TableRow
                          className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) {
                              return;
                            }
                            setSelectedDetail({ type: 'program', id: program.id });
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProgram(program.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="font-semibold">{program.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {program.code}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            {program.coordinator_name && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{program.coordinator_name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {program.course_count || 0} courses
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={program.is_active ? 'default' : 'secondary'}>
                              {program.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/programs/${program.id}/edit`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Courses under this program */}
                        {isExpanded && program.courses?.map((course: any) => {
                          const isCourseExpanded = expandedCourses.has(course.id);
                          
                          return (
                            <React.Fragment key={`course-${course.id}`}>
                              {/* Course Row */}
                              <TableRow
                                className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('button')) {
                                    return;
                                  }
                                  setSelectedDetail({ type: 'course', id: course.id });
                                }}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2 pl-8">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCourse(course.id);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isCourseExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <span className="font-medium">{course.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {course.code}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {course.credits} Credits
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {course.section_count || 0} sections
                                    </Badge>
                                    <Badge className={
                                      course.total_enrolled >= course.total_capacity ? 'bg-red-500' : ''
                                    }>
                                      {course.total_enrolled || 0}/{course.total_capacity || 0}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={course.is_active ? 'default' : 'secondary'}>
                                    {course.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenSectionDialog(course.id);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEnrollmentDialog(course.id);
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Sections under this course */}
                              {isCourseExpanded && course.sections?.map((section: any) => {
                                const schedule = section.schedule ? 
                                  (typeof section.schedule === 'string' ? JSON.parse(section.schedule) : section.schedule) 
                                  : null;

                                return (
                                  <TableRow
                                    key={`section-${section.id}`}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDetail({ type: 'section', id: section.id })}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2 pl-16">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium">
                                          Section {section.section_code}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        {section.semester_name || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {section.instructor_name && (
                                        <div className="flex items-center gap-1 text-sm">
                                          <User className="h-3 w-3 text-gray-400" />
                                          {section.instructor_name}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {schedule && Array.isArray(schedule) && schedule.length > 0 ? (
                                        <div className="space-y-1">
                                          {schedule.map((sch: any, idx: number) => (
                                            <div key={idx} className="text-xs flex items-center gap-1">
                                              <Clock className="h-3 w-3 text-gray-400" />
                                              {sch.day} {sch.time}
                                              {sch.room && (
                                                <>
                                                  <MapPin className="h-3 w-3 text-gray-400 ml-1" />
                                                  {sch.room}
                                                </>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : section.room ? (
                                        <div className="text-xs flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-gray-400" />
                                          {section.room}
                                        </div>
                                      ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={
                                        section.enrolled_count >= section.max_students ? 'bg-red-500' : ''
                                      }>
                                        {section.enrolled_count || 0}/{section.max_students || 0}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={section.is_active ? 'default' : 'secondary'}>
                                        {section.is_active ? 'Open' : 'Closed'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Navigate to section details or actions
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedDetail && (
          <div className="lg:col-span-2">
            <DetailPanel
              type={selectedDetail.type}
              id={selectedDetail.id}
              onClose={() => setSelectedDetail(null)}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateSectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        courseId={selectedCourseId}
      />

      <CreateEnrollmentDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
        courseId={selectedCourseId}
      />
    </>
  );
}
