"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { Loader2, ArrowLeft, Users, Calendar, Clock, User } from "lucide-react";

export default function ViewSectionsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get<any>(`/api/v1/academic/courses/${courseId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  // Fetch sections for this course
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['course-sections', courseId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/sections', {
        params: { course_id: courseId },
      });
      if (!response.success) throw new Error(response.error);
      return response.data?.items || [];
    },
  });

  const sections = sectionsData || [];

  if (courseLoading || sectionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Management', href: '/academics' },
          { label: 'Courses', href: '/academics' },
          { label: 'View Sections' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/academics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Course Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{course?.name || 'Course Details'}</span>
              <Badge variant="outline" className="text-sm font-mono">
                {course?.course_code}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Credits</p>
                  <p className="font-medium">{course?.credits || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Level</p>
                  <p className="font-medium">Year {course?.level || 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Sections</p>
                  <p className="font-medium">{sections.length}</p>
                </div>
              </div>
            </div>
            {course?.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Course Sections</CardTitle>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">No sections found</p>
                <p className="text-gray-500 text-sm mt-2">
                  No sections have been created for this course yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section Code</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((section: any) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-mono font-medium">
                        {section.section_code || `S${section.id}`}
                      </TableCell>
                      <TableCell>
                        {section.semester_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {section.instructor_name || 'Not assigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {section.schedule ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{section.schedule}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>
                            {section.enrolled_count || 0} / {section.max_students || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {section.is_active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
