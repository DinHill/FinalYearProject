'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, AlertTriangle, CheckCircle, XCircle, Clock, Send, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { GradeEntryDialog } from './GradeEntryDialog';

interface GradesTabProps {
  semesterId: number | null;
}

export function GradesTab({ semesterId }: GradesTabProps) {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [gradeEntryDialogOpen, setGradeEntryDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{ id: number; name: string; maxScore: number } | null>(null);

  // Fetch sections with grade summaries
  const { data: sections = [], isLoading } = useQuery({
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

  // Fetch grade summaries for sections
  const { data: gradeSummaries = {} } = useQuery({
    queryKey: ['grade-summaries', semesterId, sections],
    queryFn: async () => {
      const summaries: any = {};
      for (const section of sections) {
        try {
          const response = await api.get<any>(`/api/v1/academic/grades/summary/${section.id}`);
          if (response.success) {
            summaries[section.id] = response.data;
          } else {
            summaries[section.id] = null;
          }
        } catch (error) {
          summaries[section.id] = null;
        }
      }
      return summaries;
    },
    enabled: !!semesterId && sections.length > 0
  });

  // Get unique courses
  const courses = Array.from(
    new Map(
      sections.map((s: any) => [
        s.course_id,
        { id: s.course_id, code: s.course_code || s.course?.code }
      ])
    ).values()
  );

  // Filter sections
  const filteredSections = selectedCourse === 'all'
    ? sections
    : sections.filter((s: any) => s.course_id?.toString() === selectedCourse);

  // Submit grades mutation
  const submitMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await api.post(`/api/v1/academic/grades/submit/${sectionId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-summaries'] });
      toast.success('Grades submitted for review');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit grades');
    }
  });

  // Review grades mutation
  const reviewMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await api.post(`/api/v1/academic/grades/review/${sectionId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-summaries'] });
      toast.success('Grades moved to under review');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to review grades');
    }
  });

  // Approve grades mutation
  const approveMutation = useMutation({
    mutationFn: async ({ sectionId, notes }: { sectionId: number; notes?: string }) => {
      const response = await api.post(`/api/v1/academic/grades/approve/${sectionId}`, { notes });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-summaries'] });
      setApprovalDialogOpen(false);
      setSelectedSection(null);
      toast.success('Grades approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve grades');
    }
  });

  // Reject grades mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ sectionId, reason }: { sectionId: number; reason: string }) => {
      const response = await api.post(`/api/v1/academic/grades/reject/${sectionId}`, { rejection_reason: reason });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-summaries'] });
      setRejectDialogOpen(false);
      setSelectedSection(null);
      setRejectionReason('');
      toast.success('Grades rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject grades');
    }
  });

  // Publish grades mutation
  const publishMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await api.post(`/api/v1/academic/grades/publish/${sectionId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-summaries'] });
      toast.success('Grades published to students');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish grades');
    }
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Send className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Eye className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-[#003366]"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Handle approve click
  const handleApproveClick = (section: any) => {
    const summary = gradeSummaries[section.id];
    setSelectedSection({ ...section, summary });
    setApprovalDialogOpen(true);
  };

  // Handle reject click
  const handleRejectClick = (section: any) => {
    const summary = gradeSummaries[section.id];
    setSelectedSection({ ...section, summary });
    setRejectDialogOpen(true);
  };

  if (!semesterId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Please select a semester</p>
          <p className="text-gray-500 text-sm mt-2">Choose a semester to view grades</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grade Management</h2>
          <p className="text-gray-500 mt-1">Review and approve grades with attendance validation</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sections.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {Object.values(gradeSummaries).filter((s: any) => s?.status === 'submitted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {Object.values(gradeSummaries).filter((s: any) => s?.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#003366]">
              {Object.values(gradeSummaries).filter((s: any) => s?.status === 'published').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course: any) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grades Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-center">Total Grades</TableHead>
                <TableHead className="text-center">Attendance Failures</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No sections found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSections.map((section: any) => {
                  const summary = gradeSummaries[section.id];
                  const status = summary?.status || 'draft';
                  const totalGrades = summary?.total_grades || 0;
                  const attendanceFailures = summary?.attendance_auto_failed || 0;
                  
                  return (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">
                        {section.course_code || section.course?.code}
                      </TableCell>
                      <TableCell>{section.section_number}</TableCell>
                      <TableCell>{section.instructor_name || 'Unassigned'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{totalGrades}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {attendanceFailures > 0 ? (
                          <Badge variant="destructive" className="flex items-center justify-center gap-1 w-fit mx-auto">
                            <AlertTriangle className="h-3 w-3" />
                            {attendanceFailures}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Mock assignment data - in real app, fetch from API
                              setSelectedAssignment({
                                id: section.id,
                                name: `${section.course_code} Assignment`,
                                maxScore: 100
                              });
                              setGradeEntryDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Enter Grades
                          </Button>
                          {status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => submitMutation.mutate(section.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit
                            </Button>
                          )}
                          {status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewMutation.mutate(section.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                          {status === 'under_review' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveClick(section)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClick(section)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {status === 'approved' && (
                            <Button
                              size="sm"
                              className="bg-[#003366] hover:bg-[#002347]"
                              onClick={() => publishMutation.mutate(section.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Grades</DialogTitle>
            <DialogDescription>
              Confirm grade approval for {selectedSection?.course_code} - Section {selectedSection?.section_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedSection?.summary?.attendance_auto_failed > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Attendance Warning</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {selectedSection.summary.attendance_auto_failed} student(s) will be auto-failed due to attendance below 25%.
                        Their grades will be set to 0.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div>
              <label className="text-sm font-medium">Approval Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes or comments..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveMutation.mutate({ sectionId: selectedSection.id })}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Grades</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting grades for {selectedSection?.course_code} - Section {selectedSection?.section_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason (Required, min 10 characters)</label>
              <Textarea
                placeholder="Explain why the grades are being rejected..."
                className="mt-2"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectionReason.length < 10}
              onClick={() => rejectMutation.mutate({ 
                sectionId: selectedSection.id, 
                reason: rejectionReason 
              })}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Entry Dialog */}
      {selectedAssignment && (
        <GradeEntryDialog
          open={gradeEntryDialogOpen}
          onOpenChange={setGradeEntryDialogOpen}
          assignmentId={selectedAssignment.id}
          assignmentName={selectedAssignment.name}
          maxScore={selectedAssignment.maxScore}
        />
      )}
    </div>
  );
}
