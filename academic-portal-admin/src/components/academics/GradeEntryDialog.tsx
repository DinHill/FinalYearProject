"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, Save } from "lucide-react";

interface GradeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number;
  assignmentName?: string;
  maxScore?: number;
}

interface GradeEntry {
  student_id: number;
  student_name: string;
  score: string;
  feedback: string;
}

export function GradeEntryDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentName = "Assignment",
  maxScore = 100,
}: GradeEntryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state - track grades for all students
  const [grades, setGrades] = useState<Record<number, GradeEntry>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch enrollments for the assignment's section
  const {
    data: enrollmentsData,
    isLoading: isLoadingEnrollments,
    error: enrollmentsError,
  } = useQuery({
    queryKey: ["enrollments", "assignment", assignmentId],
    queryFn: async () => {
      // Note: We'll need to fetch the assignment first to get the section
      // For now, we'll fetch all enrollments and filter later
      const response = await api.getEnrollments(1, 1000);
      return response;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Initialize grades when enrollments load
  useEffect(() => {
    if (enrollmentsData?.data?.items) {
      const initialGrades: Record<number, GradeEntry> = {};
      interface EnrollmentWithStudent {
        student_id: number;
        student?: {
          full_name?: string;
        };
      }
      enrollmentsData.data.items.forEach((enrollment: EnrollmentWithStudent) => {
        initialGrades[enrollment.student_id] = {
          student_id: enrollment.student_id,
          student_name: enrollment.student?.full_name || "Unknown Student",
          score: "",
          feedback: "",
        };
      });
      setGrades(initialGrades);
    }
  }, [enrollmentsData]);

  // Update a single grade entry
  const updateGradeEntry = (
    studentId: number,
    field: "score" | "feedback",
    value: string
  ) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  // Validate and save all grades
  const handleSaveAllGrades = async () => {
    setIsSaving(true);

    try {
      // Filter out empty grades (students without scores)
      const gradesToSubmit = Object.values(grades).filter(
        (grade) => grade.score !== ""
      );

      if (gradesToSubmit.length === 0) {
        toast({
          title: "No Grades Entered",
          description: "Please enter at least one grade before saving.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate scores
      const invalidScores = gradesToSubmit.filter((grade) => {
        const score = parseFloat(grade.score);
        return isNaN(score) || score < 0 || score > maxScore;
      });

      if (invalidScores.length > 0) {
        toast({
          title: "Invalid Scores",
          description: `All scores must be between 0 and ${maxScore}.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Submit each grade
      const promises = gradesToSubmit.map((grade) =>
        api.createGrade(assignmentId, {
          student_id: grade.student_id,
          score: parseFloat(grade.score),
          feedback: grade.feedback || undefined,
        })
      );

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Saved ${gradesToSubmit.length} grade(s) successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      handleClose();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to save grades. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setGrades({});
    onOpenChange(false);
  };

  const students = Object.values(grades);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Grade Entry - {assignmentName}</DialogTitle>
          <DialogDescription>
            Enter grades for all students. Maximum score: {maxScore} points.
            Leave blank for students you don&apos;t want to grade yet.
          </DialogDescription>
        </DialogHeader>

        {isLoadingEnrollments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrollmentsError ? (
          <p className="text-sm text-destructive text-center py-8">
            Failed to load students. Please try again.
          </p>
        ) : (
          <div className="overflow-y-auto max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Student Name</TableHead>
                  <TableHead className="w-[150px]">
                    Score (max {maxScore})
                  </TableHead>
                  <TableHead>Feedback (Optional)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        {student.student_name}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={maxScore}
                          value={student.score}
                          onChange={(e) =>
                            updateGradeEntry(
                              student.student_id,
                              "score",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={student.feedback}
                          onChange={(e) =>
                            updateGradeEntry(
                              student.student_id,
                              "feedback",
                              e.target.value
                            )
                          }
                          placeholder="Optional feedback..."
                          className="min-h-[60px] resize-none"
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {Object.values(grades).filter((g) => g.score !== "").length} /{" "}
            {students.length} grades entered
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAllGrades}
              disabled={isSaving || students.length === 0}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Grades
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
