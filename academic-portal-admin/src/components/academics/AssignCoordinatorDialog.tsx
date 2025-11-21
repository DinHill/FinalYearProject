'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, Mail, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AssignCoordinatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: number | null;
  programName: string;
}

export function AssignCoordinatorDialog({
  open,
  onOpenChange,
  programId,
  programName,
}: AssignCoordinatorDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/users', {
        params: { role: 'teacher', status: 'active', page_size: 1000 }
      });
      if (!response.success) throw new Error(response.error);
      const teacherData = response.data?.items || [];
      console.log('Fetched teachers:', teacherData.slice(0, 5).map((t: any) => ({ id: t.id, name: t.full_name, email: t.email })));
      return teacherData;
    },
    enabled: open,
  });

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTeacherId('');
      setSearchQuery('');
    }
  }, [open]);

  // Filter teachers based on search
  const filteredTeachers = teachers.filter((teacher: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      teacher.full_name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      teacher.username.toLowerCase().includes(searchLower)
    );
  });

  // Assign coordinator mutation
  const assignMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      const response = await api.put(
        `/api/v1/academic/programs/${programId}/coordinator?coordinator_id=${teacherId}`,
        null
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      onOpenChange(false);
      toast.success('Coordinator assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign coordinator');
    },
  });

  const handleAssign = () => {
    if (!selectedTeacherId) {
      toast.error('Please select a coordinator');
      return;
    }
    // Show confirmation dialog instead of directly assigning
    setShowConfirmDialog(true);
  };

  const confirmAssign = () => {
    assignMutation.mutate(parseInt(selectedTeacherId));
    setShowConfirmDialog(false);
  };

  // Get selected teacher details for confirmation
  const selectedTeacher = teachers.find((t: any) => t.id.toString() === selectedTeacherId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Assign Program Coordinator
          </DialogTitle>
          <DialogDescription>
            Select a teacher to coordinate the <strong className="text-foreground">{programName}</strong> program
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 px-6 py-4">
          {/* Search Input */}
          <div className="space-y-2.5">
            <Label htmlFor="search" className="text-sm font-medium">
              Search Teachers
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Teachers List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Available Teachers
              </Label>
              {!teachersLoading && (
                <Badge variant="secondary" className="text-xs">
                  {filteredTeachers.length} teachers
                </Badge>
              )}
            </div>
            
            {teachersLoading ? (
              <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading teachers...</p>
                </div>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                  <User className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No teachers match your search' : 'No teachers available'}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[280px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredTeachers.map((teacher: any) => (
                    <button
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id.toString())}
                      className={`w-full text-left p-4 rounded-lg transition-all hover:bg-accent ${
                        selectedTeacherId === teacher.id.toString()
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'border border-transparent hover:border-border'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm">{teacher.full_name}</span>
                          {selectedTeacherId === teacher.id.toString() && (
                            <Badge variant="default" className="ml-auto text-xs px-2 py-0.5">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 pl-7">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{teacher.email}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending || !selectedTeacherId}
            className="gap-2"
          >
            {assignMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {assignMutation.isPending ? 'Assigning...' : 'Assign Coordinator'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Coordinator?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign <strong>{selectedTeacher?.full_name}</strong> as the coordinator for <strong>{programName}</strong>?
              {selectedTeacher && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  {selectedTeacher.email}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAssign}
              className="bg-primary hover:bg-primary/90"
            >
              Confirm Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
