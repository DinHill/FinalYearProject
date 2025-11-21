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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const [courseCode, setCourseCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("3");
  const [programId, setProgramId] = useState<string>("");
  const [level, setLevel] = useState("1");

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await api.get<any>(`/api/v1/academic/courses/${courseId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get<any[]>('/api/v1/academic/programs');
      if (!response.success) throw new Error(response.error);
      return response.data || [];
    },
  });

  // Populate form when course data loads
  useEffect(() => {
    if (course) {
      setCourseCode(course.course_code || '');
      setName(course.name || '');
      setDescription(course.description || '');
      setCredits(course.credits?.toString() || '3');
      setProgramId(course.major_id?.toString() || '');
      setLevel(course.level?.toString() || '1');
    }
  }, [course]);

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/api/v1/academic/courses/${courseId}`, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Course updated successfully');
      router.push('/academics');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update course');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!courseCode.trim()) {
      toast.error('Please enter a course code');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a course name');
      return;
    }

    if (!programId) {
      toast.error('Please select a program');
      return;
    }

    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      toast.error('Credits must be between 1 and 10');
      return;
    }

    updateMutation.mutate({
      course_code: courseCode.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      credits: creditsNum,
      major_id: parseInt(programId),
      level: parseInt(level),
    });
  };

  if (courseLoading) {
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
          { label: 'Edit Course' }
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
              Update the course details. All fields marked with <span className="text-destructive">*</span> are required.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Edit the basic details about the course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Code and Credits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">
                    Course Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="courseCode"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g., CS101"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique course identifier
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">
                    Credits <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Credit hours (1-10)
                  </p>
                </div>
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Course Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The full name of the course
                </p>
              </div>

              {/* Program and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program">
                    Program <span className="text-red-500">*</span>
                  </Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program: any) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name} ({program.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">
                    Level <span className="text-red-500">*</span>
                  </Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger id="level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1 (Freshman)</SelectItem>
                      <SelectItem value="2">Year 2 (Sophomore)</SelectItem>
                      <SelectItem value="3">Year 3 (Junior)</SelectItem>
                      <SelectItem value="4">Year 4 (Senior)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a comprehensive description of the course..."
                  className="min-h-[150px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Overview of what the course covers
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
    </AdminLayout>
  );
}
