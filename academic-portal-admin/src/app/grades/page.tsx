'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Grade } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Filter,
  Award,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { SmartPagination } from '@/components/ui/smart-pagination';

export default function GradesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const queryClient = useQueryClient();

  // Fetch grades
  const { data: gradesData, isLoading } = useQuery({
    queryKey: ['grades', page, sectionFilter, statusFilter],
    queryFn: async () => {
      const result = await api.getGrades(
        page,
        20,
        sectionFilter ? parseInt(sectionFilter) : undefined,
        undefined,
        statusFilter || undefined
      );
      return result.data;
    },
  });

  const grades: Grade[] = gradesData?.items || [];
  const total = gradesData?.total || 0;
  const totalPages = Math.ceil(total / 20);

  // Create grade mutation
  const createMutation = useMutation({
    mutationFn: async (data: { assignment_id: number; student_id: number; score: number; feedback?: string }) => {
      return await api.createGrade(data.assignment_id, {
        student_id: data.student_id,
        score: data.score,
        max_score: 100,
        feedback: data.feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsCreateDialogOpen(false);
      toast.success('Grade created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to create grade');
    },
  });

  // Update grade mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ score: number; feedback: string }> }) => {
      return await api.updateGrade(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsEditDialogOpen(false);
      setSelectedGrade(null);
      toast.success('Grade updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to update grade');
    },
  });

  // Delete grade mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.deleteGrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setIsDeleteDialogOpen(false);
      setSelectedGrade(null);
      toast.success('Grade deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to delete grade');
    },
  });

  const handleUpdateGrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGrade) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      score: parseFloat(formData.get('score') as string),
      feedback: formData.get('feedback') as string,
    };

    updateMutation.mutate({ id: selectedGrade.id, data });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      published: 'bg-purple-100 text-purple-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredGrades = grades.filter((grade) => {
    if (searchTerm && grade.assignment_name) {
      return grade.assignment_name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Grade Management' }]}
        subtitle="Manage student grades, scores, and GPA calculations"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button 
              size="sm" 
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Grade
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">All recorded grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {grades.filter(g => g.approval_status === 'published').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Visible to students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {grades.filter(g => g.approval_status === 'under_review').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {grades.filter(g => g.approval_status === 'draft').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Not yet submitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Grade Records
            </CardTitle>
            <CardDescription>View and manage all student grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by assignment name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No grades found</p>
                <p className="text-sm mt-2">Create a new grade to get started</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Enrollment ID</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Graded At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          {grade.assignment_name || 'N/A'}
                        </TableCell>
                        <TableCell>#{grade.enrollment_id}</TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {grade.grade_value?.toString() || '0'}/{grade.max_grade?.toString() || '100'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {grade.weight ? `${grade.weight}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(grade.approval_status)}>
                            {grade.approval_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString() : 'Not graded'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedGrade(grade);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedGrade(grade);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <SmartPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={20}
                  itemName="grades"
                  onPageChange={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Grade Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update the score and feedback for this grade
            </DialogDescription>
          </DialogHeader>
          {selectedGrade && (
            <form onSubmit={handleUpdateGrade}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Assignment</Label>
                  <Input value={selectedGrade.assignment_name || 'N/A'} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-score">Score *</Label>
                  <Input
                    id="edit-score"
                    name="score"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedGrade.max_grade || 100}
                    defaultValue={selectedGrade.grade_value || 0}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-feedback">Feedback</Label>
                  <Textarea
                    id="edit-feedback"
                    name="feedback"
                    rows={3}
                    placeholder="Enter feedback for the student..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedGrade(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grade? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedGrade && (
            <div className="py-4">
              <p className="text-sm">
                <span className="font-semibold">Assignment:</span> {selectedGrade.assignment_name || 'N/A'}
              </p>
              <p className="text-sm mt-2">
                <span className="font-semibold">Score:</span> {selectedGrade.grade_value || 0}/{selectedGrade.max_grade || 100}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedGrade(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedGrade && deleteMutation.mutate(selectedGrade.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
