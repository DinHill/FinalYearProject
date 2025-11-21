'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ClipboardCheck, 
  FileCheck,
  Users,
  FileText,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { UnifiedCourseViewEnhanced } from '@/components/academics/UnifiedCourseViewEnhanced';
import { TimetableTab } from '@/components/academics/TimetableTab';
import { AttendanceTab } from '@/components/academics/AttendanceTab';
import { GradesTab } from '@/components/academics/GradesTab';
import { MaterialsCourseView } from '@/components/academics/MaterialsCourseView';

export default function AcademicsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Fetch semesters
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const response = await api.get<any[]>('/api/v1/academic/semesters');
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    }
  });

  // Fetch current semester
  const { data: currentSemester } = useQuery({
    queryKey: ['current-semester'],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/semesters/current');
      if (!response.success) throw new Error(response.error);
      return response.data;
    }
  });

  // Set selected semester to current on load
  useEffect(() => {
    if (!selectedSemester && currentSemester?.id) {
      setSelectedSemester(currentSemester.id);
    }
  }, [currentSemester, selectedSemester]);

  // Fetch academic dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['academic-dashboard-stats', selectedSemester],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/dashboard/stats', {
        params: { semester_id: selectedSemester }
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!selectedSemester
  });



  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header with Semester Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#003366]">Academic Management</h1>
            <p className="text-gray-500 mt-1">
              Manage programs, courses, timetable, attendance, and grades
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/semesters/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Semester
            </Button>
            <Select 
              value={selectedSemester?.toString() || ''} 
              onValueChange={(value) => setSelectedSemester(parseInt(value))}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester: any) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.name} {semester.is_active && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dashboard Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.total_programs || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.total_courses || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.active_students || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Instructors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.active_instructors || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.attendance_compliance?.toFixed(1) || 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Grade Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dashboardStats.grade_approval_rate?.toFixed(1) || 0}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="curriculum" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timetable
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Grades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum">
            <UnifiedCourseViewEnhanced semesterId={selectedSemester} />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsCourseView semesterId={selectedSemester} />
          </TabsContent>

          <TabsContent value="timetable">
            <TimetableTab semesterId={selectedSemester} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTab semesterId={selectedSemester} />
          </TabsContent>

          <TabsContent value="grades">
            <GradesTab semesterId={selectedSemester} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}