'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Plus, MoreHorizontal, Edit, Trash2, UserPlus, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AssignCoordinatorDialog } from './AssignCoordinatorDialog';

interface ProgramsTabProps {
  semesterId: number | null;
}

export function ProgramsTab({ semesterId }: ProgramsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [programToToggle, setProgramToToggle] = useState<any>(null);
  const [coordinatorDialogOpen, setCoordinatorDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Fetch programs
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get<any[]>('/api/v1/academic/programs');
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
    refetchOnMount: 'always', // Always refetch when component mounts
    staleTime: 0, // Consider data stale immediately
  });

  // Toggle program status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ programId, isActive }: { programId: number; isActive: boolean }) => {
      // If currently active, deactivate (DELETE). If inactive, activate (PATCH)
      const response = isActive
        ? await api.delete(`/api/v1/academic/programs/${programId}`)
        : await api.patch(`/api/v1/academic/programs/${programId}`, { is_active: true });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setProgramToToggle(null);
      toast.success(variables.isActive ? 'Program deactivated successfully' : 'Program activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update program status');
    }
  });

  const confirmToggle = () => {
    if (programToToggle) {
      toggleStatusMutation.mutate({
        programId: programToToggle.id,
        isActive: programToToggle.is_active
      });
    }
  };

  // Filter programs
  const filteredPrograms = programs.filter((program: any) =>
    program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Programs</h2>
          <p className="text-gray-500 mt-1">Manage degree programs and majors</p>
        </div>
        <Button 
          className="bg-[#003366] hover:bg-[#002347]"
          onClick={() => router.push('/programs/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{programs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {programs.filter((p: any) => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {programs.reduce((sum: number, p: any) => sum + (p.student_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {programs.reduce((sum: number, p: any) => sum + (p.course_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No programs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program: any) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.code}</TableCell>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.campus_name || 'N/A'}</TableCell>
                    <TableCell>{program.coordinator_name || 'Unassigned'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{program.student_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{program.course_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={program.is_active ? 'default' : 'secondary'}
                        className={program.is_active ? 'bg-green-600' : ''}
                      >
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/programs/${program.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Program
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProgram(program);
                            setCoordinatorDialogOpen(true);
                          }}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Coordinator
                          </DropdownMenuItem>
                          {program.is_active ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setProgramToToggle(program)}
                              disabled={program.student_count > 0 || program.course_count > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => setProgramToToggle(program)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={programToToggle !== null} onOpenChange={() => setProgramToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {programToToggle?.is_active ? 'Deactivate' : 'Activate'} Program
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {programToToggle?.is_active ? 'deactivate' : 'activate'}{' '}
              <strong>{programToToggle?.name}</strong> ({programToToggle?.code})?
              {programToToggle?.is_active
                ? ' This will change the program status to inactive.'
                : ' This will change the program status to active.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleStatusMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              disabled={toggleStatusMutation.isPending}
              className={programToToggle?.is_active ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {toggleStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {programToToggle?.is_active ? 'Deactivating...' : 'Activating...'}
                </>
              ) : (
                programToToggle?.is_active ? 'Deactivate' : 'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Coordinator Dialog */}
      <AssignCoordinatorDialog
        open={coordinatorDialogOpen}
        onOpenChange={setCoordinatorDialogOpen}
        programId={selectedProgram?.id || null}
        programName={selectedProgram?.name || ''}
      />
    </div>
  );
}
