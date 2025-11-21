'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Users, BookOpen, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { CreateSectionDialog } from './CreateSectionDialog';
import { CreateEnrollmentDialog } from './CreateEnrollmentDialog';
import { BulkEnrollmentDialog } from './BulkEnrollmentDialog';

interface CoursesTabProps {
  semesterId: number | null;
}

export function CoursesTab({ semesterId }: CoursesTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [bulkEnrollmentDialogOpen, setBulkEnrollmentDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [courseToToggle, setCourseToToggle] = useState<any>(null);

  // Fetch programs for filter
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get<any[]>('/api/v1/academic/programs');
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    }
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', semesterId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/courses', {
        params: { semester_id: semesterId }
      });
      if (!response.success) throw new Error(response.error);
      // Backend returns paginated response with items array
      return response.data?.items || [];
    },
    enabled: !!semesterId
  });

  // Toggle course status mutation
  const toggleCourseMutation = useMutation({
    mutationFn: async ({ courseId, isActive }: { courseId: number; isActive: boolean }) => {
      // If currently active, deactivate (set to false). If inactive, activate (set to true)
      const response = await api.patch(`/api/v1/academic/courses/${courseId}`, { 
        is_active: !isActive 
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCourseToToggle(null);
      toast.success(variables.isActive ? 'Course deactivated successfully' : 'Course activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update course status');
    }
  });

  const confirmToggle = () => {
    if (courseToToggle) {
      toggleCourseMutation.mutate({
        courseId: courseToToggle.id,
        isActive: courseToToggle.is_active
      });
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = 
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = programFilter === 'all' || course.program_id?.toString() === programFilter;
    
    return matchesSearch && matchesProgram;
  });

  // Calculate stats
  const totalEnrollment = courses.reduce((sum: number, c: any) => sum + (c.total_enrolled || 0), 0);
  const totalCapacity = courses.reduce((sum: number, c: any) => sum + (c.total_capacity || 0), 0);
  const utilizationRate = totalCapacity > 0 ? ((totalEnrollment / totalCapacity) * 100).toFixed(1) : '0';

  if (!semesterId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Please select a semester</p>
          <p className="text-gray-500 text-sm mt-2">Choose a semester to view courses</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
          <p className="text-gray-500 mt-1">Manage courses and sections</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setBulkEnrollmentDialogOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Bulk Enroll Students
          </Button>
          <Button 
            className="bg-[#003366] hover:bg-[#002347]"
            onClick={() => router.push('/courses/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEnrollment}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{utilizationRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((program: any) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-center">Sections</TableHead>
                <TableHead className="text-center">Enrollment</TableHead>
                <TableHead className="text-center">Capacity</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No courses found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course: any) => {
                  const enrolled = course.total_enrolled || 0;
                  const capacity = course.total_capacity || 0;
                  const fillRate = capacity > 0 ? (enrolled / capacity) * 100 : 0;
                  const isFull = enrolled >= capacity;
                  
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.code || course.course_code}
                      </TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.program_name || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{course.section_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isFull ? 'destructive' : 'outline'}>
                          {enrolled}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{capacity}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={course.is_active ? 'default' : 'secondary'}
                            className={course.is_active ? 'bg-green-600' : ''}
                          >
                            {course.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {fillRate > 90 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              {fillRate.toFixed(0)}% Full
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setSectionDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Section
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // For enrollment, we need a section ID
                                // Check if course has sections using section_count
                                if (course.section_count && course.section_count > 0) {
                                  // Open the CreateEnrollmentDialog without pre-selecting section
                                  // User will select the section inside the dialog
                                  setEnrollmentDialogOpen(true);
                                } else {
                                  toast.error('Please create a section first before enrolling students');
                                }
                              }}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Enroll Students
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/courses/${course.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/courses/${course.id}/sections`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Sections
                            </DropdownMenuItem>
                            {course.is_active ? (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setCourseToToggle(course)}
                                disabled={course.section_count > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => setCourseToToggle(course)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <BulkEnrollmentDialog
        open={bulkEnrollmentDialogOpen}
        onOpenChange={setBulkEnrollmentDialogOpen}
      />

      {/* Toggle Course Status Dialog */}
      <AlertDialog open={courseToToggle !== null} onOpenChange={() => setCourseToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {courseToToggle?.is_active ? 'Deactivate' : 'Activate'} Course
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {courseToToggle?.is_active ? 'deactivate' : 'activate'}{' '}
              <strong>{courseToToggle?.name}</strong> ({courseToToggle?.code || courseToToggle?.course_code})?
              {courseToToggle?.is_active
                ? ' This will change the course status to inactive.'
                : ' This will change the course status to active.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleCourseMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              disabled={toggleCourseMutation.isPending}
              className={courseToToggle?.is_active ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {toggleCourseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {courseToToggle?.is_active ? 'Deactivating...' : 'Activating...'}
                </>
              ) : (
                courseToToggle?.is_active ? 'Deactivate' : 'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
