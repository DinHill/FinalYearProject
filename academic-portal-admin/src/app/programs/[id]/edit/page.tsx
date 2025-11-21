"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const programId = params.id as string;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch program details
  const { data: program, isLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const response = await api.get<any>(`/api/v1/academic/programs/${programId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  // Populate form when program data loads
  useEffect(() => {
    if (program) {
      setName(program.name || '');
      setCode(program.code || '');
      setDescription(program.description || '');
    }
  }, [program]);

  // Update program mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string | undefined }) => {
      const response = await api.put(`/api/v1/academic/programs/${programId}`, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Program updated successfully');
      router.push('/academics');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update program');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Please enter a program name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter a program code');
      return;
    }

    // Show confirmation dialog instead of directly saving
    setShowSaveDialog(true);
  };

  const confirmSaveChanges = () => {
    updateMutation.mutate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
    });
    setShowSaveDialog(false);
  };

  if (isLoading) {
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
          { label: 'Programs', href: '/academics' },
          { label: 'Edit Program' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/academics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Update the program details. All fields marked with <span className="text-destructive">*</span> are required.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
              <CardDescription>
                Edit the basic details about the program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Program Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Computer Science"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The full name of the program
                </p>
              </div>

              {/* Program Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Program Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., C, B, D"
                  required
                  maxLength={3}
                />
                <p className="text-xs text-muted-foreground">
                  A unique 1-3 character code identifier (will be uppercase)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Program Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a comprehensive description of the program..."
                  className="min-h-[150px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Overview of what the program offers
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/academics')}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to <strong>{program?.name || 'this program'}</strong>? 
              This will update the program name, code, and description.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSaveChanges}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
