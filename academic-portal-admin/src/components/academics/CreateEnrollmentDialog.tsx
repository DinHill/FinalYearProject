"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import api, { User, Section } from "@/lib/api";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId?: string; // Optional: pre-select section if opening from section page
  studentId?: string; // Optional: pre-select student if opening from student page
}

export function CreateEnrollmentDialog({
  open,
  onOpenChange,
  sectionId,
  studentId,
}: CreateEnrollmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(studentId ? [studentId] : []);
  const [selectedSectionId, setSelectedSectionId] = useState(sectionId || "");
  const [enrollmentStatus, setEnrollmentStatus] = useState("enrolled");
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  // Update form when props change (e.g., opening from different contexts)
  useEffect(() => {
    if (studentId) setSelectedStudentIds([studentId]);
    if (sectionId) setSelectedSectionId(sectionId);
  }, [studentId, sectionId]);

  // Fetch students with search
  const {
    data: studentsData,
    isLoading: isLoadingStudents,
    error: studentsError,
  } = useQuery({
    queryKey: ["users", "students", studentSearchTerm],
    queryFn: async () => {
      // Fetch more students with search capability
      const response = await api.getUsers(1, 100, "student");
      return response;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Fetch sections
  const {
    data: sectionsData,
    isLoading: isLoadingSections,
    error: sectionsError,
  } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const response = await api.getSections(1, 1000);
      return response;
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollments: Array<{
      student_id: number;
      section_id: number;
      status?: string;
    }>) => {
      console.log('🔵 Starting enrollment for:', enrollments);
      // Enroll multiple students
      try {
        const results = await Promise.all(
          enrollments.map(async (data) => {
            console.log('🔵 Enrolling:', data);
            const result = await api.createEnrollment(data);
            console.log('✅ Enrolled:', result);
            return result;
          })
        );
        console.log('✅ All enrollments complete:', results);
        return results;
      } catch (error) {
        console.error('❌ Enrollment error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedStudentIds.length} student(s) enrolled successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["unified-courses"] });
      handleClose();
    },
    onError: (error: Error) => {
      console.error('❌ Mutation error:', error);
      const apiError = error as any;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          apiError.message ||
          "Failed to enroll student(s). Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (selectedStudentIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSectionId) {
      toast({
        title: "Validation Error",
        description: "Please select a section",
        variant: "destructive",
      });
      return;
    }

    // Create enrollments for all selected students
    const enrollments = selectedStudentIds.map(studentId => ({
      student_id: parseInt(studentId),
      section_id: parseInt(selectedSectionId),
      status: enrollmentStatus,
    }));

    createEnrollmentMutation.mutate(enrollments);
  };

  const handleClose = () => {
    setSelectedStudentIds(studentId ? [studentId] : []);
    setSelectedSectionId(sectionId || "");
    setEnrollmentStatus("active");
    setStudentSearchTerm("");
    setStudentSearchOpen(false);
    onOpenChange(false);
  };

  const students = studentsData?.data?.items || [];
  const sections = sectionsData?.data?.items || [];

  // Filter students based on search term - only include students with valid id
  const filteredStudents = students
    .filter((student: any) => student.id || student.user_id) // Check both id and user_id
    .filter((student: any) => {
      if (!studentSearchTerm) return true;
      const searchLower = studentSearchTerm.toLowerCase();
      return (
        student.full_name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.username?.toLowerCase().includes(searchLower)
      );
    });

  const selectedStudent = students.find((s: any) => {
    const studentId = s.id || s.user_id;
    return String(studentId) === selectedStudentIds[0];
  });

  const selectedStudents = students.filter((s: any) => {
    const studentId = s.id || s.user_id;
    return selectedStudentIds.includes(String(studentId));
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Enroll a student in a course section. This will give them access to
            the course materials and attendance tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-6 px-6 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">
              Students <span className="text-red-500">*</span>
            </Label>
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : studentsError ? (
              <p className="text-sm text-destructive">
                Failed to load students. Please try again.
              </p>
            ) : (
              <div className="space-y-2">
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentSearchOpen}
                      className="w-full justify-between"
                      disabled={!!studentId}
                    >
                      {selectedStudents.length > 0 ? (
                        <span className="truncate">
                          {selectedStudents.length} student(s) selected
                        </span>
                      ) : (
                        "Search and select students..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[460px] p-0" align="start">
                    <Command shouldFilter={false} loop>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          placeholder="Search by name, email, or username..."
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <CommandList>
                        <CommandEmpty>
                          {studentSearchTerm ? "No students found." : "Type to search students..."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.slice(0, 50).map((student: any, index: number) => {
                            const studentId = student.id || student.user_id;
                            const isSelected = selectedStudentIds.includes(String(studentId));
                            return (
                              <CommandItem
                                key={`student-${studentId}-${index}`}
                                value={studentId.toString()}
                                onSelect={(selectedValue) => {
                                  setSelectedStudentIds(prev => {
                                    if (prev.includes(selectedValue)) {
                                      // Remove if already selected
                                      return prev.filter(id => id !== selectedValue);
                                    } else {
                                      // Add to selection
                                      return [...prev, selectedValue];
                                    }
                                  });
                                  // Don't close the popover for multi-select
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{student.full_name}</span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {student.username} • {student.email}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        {filteredStudents.length > 50 && (
                          <div className="p-2 text-center text-xs text-muted-foreground border-t">
                            Showing first 50 results. Refine your search to see more.
                          </div>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Display selected students as badges */}
                {selectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                    {selectedStudents.map((student: any) => {
                      const studentId = student.id || student.user_id;
                      return (
                        <div
                          key={`selected-${studentId}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand-orange text-white rounded-md"
                        >
                          <span>{student.full_name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentIds(prev => 
                                prev.filter(id => id !== String(studentId))
                              );
                            }}
                            className="hover:bg-brand-orange/80 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <Label htmlFor="section">
              Section <span className="text-red-500">*</span>
            </Label>
            {isLoadingSections ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sectionsError ? (
              <p className="text-sm text-destructive">
                Failed to load sections. Please try again.
              </p>
            ) : (
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={!!sectionId} // Disable if pre-selected from section page
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections
                    .filter((section: any) => section.section_id) // Filter out items without IDs
                    .map((section: any, index: number) => (
                      <SelectItem
                        key={`section-${section.section_id || index}`}
                        value={String(section.section_id)}
                      >
                        {section.course?.course_code} - Section{" "}
                        {section.section_number}
                        {section.semester && ` (${section.semester.semester_name})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Enrollment Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usually set to &ldquo;Enrolled&rdquo; for new enrollments
            </p>
          </div>
          </div>

          <DialogFooter className="px-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEnrollmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEnrollmentMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              {createEnrollmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                `Enroll ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
