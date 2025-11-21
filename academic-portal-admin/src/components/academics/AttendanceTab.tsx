'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Download, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Users,
  TrendingDown,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceDialog } from './AttendanceDialog';
import { cn } from '@/lib/utils';

interface AttendanceTabProps {
  semesterId: number | null;
}

export function AttendanceTab({ semesterId }: AttendanceTabProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ id: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch semester compliance overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['attendance-overview', semesterId],
    queryFn: async () => {
      const response = await api.get<any>(`/api/v1/academic/attendance/compliance/semester/${semesterId}`);
      if (!response.success) throw new Error(response.error);
      
      // Calculate totals from sections_summary
      const sections = response.data?.sections_summary || [];
      const totals = sections.reduce((acc: any, section: any) => {
        acc.compliant_count += section.compliant_count || 0;
        acc.at_risk_count += section.at_risk_count || 0;
        acc.exam_ineligible_count += section.exam_ineligible_count || 0;
        acc.auto_fail_count += section.auto_failed_count || 0;
        return acc;
      }, { compliant_count: 0, at_risk_count: 0, exam_ineligible_count: 0, auto_fail_count: 0 });
      
      return {
        ...response.data,
        ...totals
      };
    },
    enabled: !!semesterId
  });

  // Fetch at-risk students
  const { data: atRiskStudents = [], isLoading: atRiskLoading } = useQuery({
    queryKey: ['at-risk-students', semesterId],
    queryFn: async () => {
      const response = await api.get<any[]>('/api/v1/academic/attendance/at-risk', {
        params: { semester_id: semesterId }
      });
      if (!response.success) throw new Error(response.error);
      // Backend returns paginated response with items array
      return response.data?.items || [];
    },
    enabled: !!semesterId
  });

  // Fetch sections for course filter
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', semesterId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/sections', {
        params: { semester_id: semesterId }
      });
      if (!response.success) throw new Error(response.error);
      // Backend returns paginated response with items array
      return response.data?.items || [];
    },
    enabled: !!semesterId
  });

  // Get unique courses
  const courses = Array.from(
    new Map(
      sections.map((s: any) => [
        s.course_id,
        { id: s.course_id, code: s.course_code || s.course?.code, name: s.course_name || s.course?.name }
      ])
    ).values()
  );

  // Filter at-risk students by course and search
  const filteredAtRisk = atRiskStudents.filter((s: any) => {
    const matchesCourse = selectedCourse === 'all' || s.course_id?.toString() === selectedCourse;
    const matchesSearch = !searchQuery || 
      s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  // Get compliance badge
  const getComplianceBadge = (level: string) => {
    switch (level) {
      case 'compliant':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'at_risk':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />At Risk</Badge>;
      case 'exam_ineligible':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Exam Ineligible</Badge>;
      case 'auto_fail':
        return <Badge variant="destructive" className="bg-red-700"><XCircle className="h-3 w-3 mr-1" />Auto-Fail</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Export attendance report
  const handleExport = async (sectionId: number) => {
    try {
      const response = await api.get<any[]>(`/api/v1/academic/attendance/export/${sectionId}`);
      if (!response.success) {
        toast.error(response.error || 'Failed to export report');
        return;
      }
      const data = response.data || [];
      
      // Convert to CSV
      const csv = [
        ['Student Name', 'Student Email', 'Course', 'Section', 'Present', 'Total Sessions', 'Attendance %', 'Compliance'],
        ...data.map((row: any) => [
          row.student_name,
          row.student_email,
          row.course_name,
          row.section_number,
          row.present_count,
          row.total_sessions,
          row.attendance_percentage,
          row.compliance_level
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-section-${sectionId}.csv`;
      a.click();
      
      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to export report');
    }
  };

  if (!semesterId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Please select a semester</p>
          <p className="text-gray-500 text-sm mt-2">Choose a semester to view attendance</p>
        </div>
      </div>
    );
  }

  if (overviewLoading || atRiskLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
            <p className="text-gray-500 text-sm">Monitor and manage student attendance (≥75% required for exam eligibility)</p>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{overview?.overall_compliance?.toFixed(1) || 0}%</p>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Compliant</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{overview?.compliant_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">≥75% attendance</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{overview?.at_risk_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">65-74% attendance</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Exam Ineligible</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{overview?.exam_ineligible_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">50-64% attendance</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Auto-Fail</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{overview?.auto_fail_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">&lt;50% attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      {atRiskStudents.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 text-lg">
                  {atRiskStudents.length} Student{atRiskStudents.length > 1 ? 's' : ''} Need Attention
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  These students have attendance below 75% and may fail. Consider immediate intervention.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('at-risk')}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            At Risk ({atRiskStudents.length})
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Users className="h-4 w-4" />
            Sections
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution</CardTitle>
              <CardDescription>Overview of student attendance compliance levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Compliant Students</p>
                      <p className="text-sm text-green-700">75% or higher attendance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">{overview?.compliant_count || 0}</p>
                    <p className="text-sm text-green-700">students</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">At Risk</p>
                      <p className="text-sm text-yellow-700">65-74% attendance - needs monitoring</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-600">{overview?.at_risk_count || 0}</p>
                    <p className="text-sm text-yellow-700">students</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Exam Ineligible</p>
                      <p className="text-sm text-orange-700">50-64% attendance - cannot take exams</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">{overview?.exam_ineligible_count || 0}</p>
                    <p className="text-sm text-orange-700">students</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Auto-Fail</p>
                      <p className="text-sm text-red-700">Below 50% attendance - automatic failure</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{overview?.auto_fail_count || 0}</p>
                    <p className="text-sm text-red-700">students</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* At-Risk Students Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by student name, email, or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Students Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Students Below 75% Attendance
              </CardTitle>
              <CardDescription>
                {filteredAtRisk.length} student{filteredAtRisk.length !== 1 ? 's' : ''} require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="text-center font-semibold">Present</TableHead>
                      <TableHead className="text-center font-semibold">Total</TableHead>
                      <TableHead className="text-center font-semibold">Rate</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtRisk.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                          <p className="text-gray-600 font-medium">All students are compliant!</p>
                          <p className="text-gray-500 text-sm mt-1">No students below 75% attendance</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAtRisk.map((student: any, idx: number) => {
                        const percentage = parseFloat(student.attendance_percentage);
                        return (
                          <TableRow 
                            key={idx}
                            className={cn(
                              "hover:bg-gray-50 transition-colors",
                              percentage < 50 && "bg-red-50/50",
                              percentage >= 50 && percentage < 65 && "bg-orange-50/50",
                              percentage >= 65 && percentage < 75 && "bg-yellow-50/50"
                            )}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name}</p>
                                <p className="text-sm text-gray-500">{student.student_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{student.course_code}</p>
                                <p className="text-sm text-gray-500">Section {student.section_code}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{student.present_count || 0}</TableCell>
                            <TableCell className="text-center font-medium">{student.total_sessions || 0}</TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="destructive" 
                                className={cn(
                                  percentage < 50 && "bg-red-700 hover:bg-red-800",
                                  percentage >= 50 && percentage < 65 && "bg-orange-600 hover:bg-orange-700",
                                  percentage >= 65 && percentage < 75 && "bg-yellow-600 hover:bg-yellow-700"
                                )}
                              >
                                {percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {getComplianceBadge(student.compliance_level)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleExport(student.section_id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Compliance Summary</CardTitle>
              <CardDescription>View and manage attendance for each section</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!overview?.sections_summary || overview.sections_summary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">No sections found</p>
                  <p className="text-gray-500 text-sm mt-1">Sections will appear here once created</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Course</TableHead>
                        <TableHead className="font-semibold">Section</TableHead>
                        <TableHead className="text-center font-semibold">Students</TableHead>
                        <TableHead className="text-center font-semibold">Avg Rate</TableHead>
                        <TableHead className="text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Compliant
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            At Risk
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            Ineligible
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            Auto-Fail
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.sections_summary.map((section: any) => {
                        const avgAttendance = section.avg_attendance || 0;
                        return (
                          <TableRow key={section.section_id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">{section.course_code}</TableCell>
                            <TableCell>{section.section_code}</TableCell>
                            <TableCell className="text-center font-medium">{section.total_students}</TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={avgAttendance >= 75 ? "default" : "destructive"}
                                className={cn(
                                  avgAttendance >= 75 && "bg-green-600 hover:bg-green-700",
                                  avgAttendance < 75 && avgAttendance >= 65 && "bg-yellow-600 hover:bg-yellow-700",
                                  avgAttendance < 65 && avgAttendance >= 50 && "bg-orange-600 hover:bg-orange-700",
                                  avgAttendance < 50 && "bg-red-700 hover:bg-red-800"
                                )}
                              >
                                {avgAttendance.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {section.compliant_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {section.at_risk_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {section.exam_ineligible_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                {section.auto_failed_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExport(section.section_id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSection({
                                      id: section.section_id,
                                      name: `${section.course_code} - Section ${section.section_code}`
                                    });
                                    setAttendanceDialogOpen(true);
                                  }}
                                  className="bg-[#003366] hover:bg-[#00509E]"
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-1" />
                                  Mark
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Dialog */}
      {selectedSection && (
        <AttendanceDialog
          open={attendanceDialogOpen}
          onOpenChange={setAttendanceDialogOpen}
          sectionId={selectedSection.id}
          sectionName={selectedSection.name}
        />
      )}
    </div>
  );
}
