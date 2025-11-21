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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, Save, CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: number;
  sectionName?: string;
}

interface AttendanceEntry {
  student_id: number;
  student_name: string;
  status: "present" | "absent" | "late" | "excused";
}

export function AttendanceDialog({
  open,
  onOpenChange,
  sectionId,
  sectionName = "Section",
}: AttendanceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<number, AttendanceEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Fetch enrollments for this section
  const {
    data: enrollmentsData,
    isLoading: isLoadingEnrollments,
    error: enrollmentsError,
  } = useQuery({
    queryKey: ["enrollments", sectionId],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/enrollments', {
        params: { section_id: sectionId, page_size: 1000 }
      });
      if (!response.success) throw new Error(response.error);
      return response.data?.items || [];
    },
    enabled: open,
  });

  // Fetch existing attendance for selected date
  const {
    data: existingAttendance,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance
  } = useQuery({
    queryKey: ["attendance", sectionId, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/academic/attendance', {
        params: { 
          section_id: sectionId, 
          date: format(date, "yyyy-MM-dd"),
          page_size: 1000
        }
      });
      if (!response.success) throw new Error(response.error);
      return response.data?.items || [];
    },
    enabled: open && !!date,
  });

  // Initialize attendance when enrollments load
  useEffect(() => {
    if (enrollmentsData && Array.isArray(enrollmentsData)) {
      const initialAttendance: Record<number, AttendanceEntry> = {};
      
      enrollmentsData.forEach((enrollment: any) => {
        initialAttendance[enrollment.student_id] = {
          student_id: enrollment.student_id,
          student_name: enrollment.student?.full_name || "Unknown Student",
          status: "absent",
        };
      });
      
      setAttendance(initialAttendance);
    }
  }, [enrollmentsData]);

  // Update attendance with existing records when they load
  useEffect(() => {
    if (existingAttendance && Array.isArray(existingAttendance) && existingAttendance.length > 0) {
      setHasExistingData(true);
      
      setAttendance(prev => {
        const updated = { ...prev };
        
        existingAttendance.forEach((record: any) => {
          // Find student_id from enrollment
          const enrollment = enrollmentsData?.find((e: any) => e.id === record.enrollment_id);
          if (enrollment) {
            updated[enrollment.student_id] = {
              ...updated[enrollment.student_id],
              status: record.status
            };
          }
        });
        
        return updated;
      });
    } else {
      setHasExistingData(false);
    }
  }, [existingAttendance, enrollmentsData]);

  // Toggle individual attendance
  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId].status === "present" ? "absent" : "present",
      },
    }));
  };

  // Mark all as present
  const markAllPresent = () => {
    const updatedAttendance = { ...attendance };
    Object.keys(updatedAttendance).forEach((key) => {
      updatedAttendance[parseInt(key)].status = "present";
    });
    setAttendance(updatedAttendance);
    toast({
      title: "All Marked Present",
      description: "All students have been marked as present",
    });
  };

  // Mark all as absent
  const markAllAbsent = () => {
    const updatedAttendance = { ...attendance };
    Object.keys(updatedAttendance).forEach((key) => {
      updatedAttendance[parseInt(key)].status = "absent";
    });
    setAttendance(updatedAttendance);
    toast({
      title: "All Marked Absent",
      description: "All students have been marked as absent",
    });
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    setIsSaving(true);

    try {
      const attendanceRecords = Object.values(attendance).map((entry) => ({
        student_id: entry.student_id,
        status: entry.status,
      }));

      if (attendanceRecords.length === 0) {
        toast({
          title: "No Students",
          description: "No students found for this section.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      await api.markAttendanceBulk({
        section_id: sectionId,
        date: format(date, "yyyy-MM-dd"),
        attendance_records: attendanceRecords,
      });

      toast({
        title: "Success",
        description: `Attendance saved for ${attendanceRecords.length} student(s)`,
      });

      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      handleClose();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDate(new Date());
    setAttendance({});
    setHasExistingData(false);
    onOpenChange(false);
  };

  const students = Object.values(attendance);
  const presentCount = students.filter((s) => s.status === "present").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            {hasExistingData ? 'Review Attendance' : 'Mark Attendance'} - {sectionName}
          </DialogTitle>
          <DialogDescription>
            {hasExistingData 
              ? 'Review and approve attendance submitted by the teacher.'
              : 'Select the date and mark attendance for all students in this section.'}
          </DialogDescription>
        </DialogHeader>

        {/* Info Banner */}
        {hasExistingData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Teacher Submitted Attendance
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This attendance was submitted by the teacher. You can review and edit if needed.
              </p>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Attendance Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    // Refetch attendance for new date
                    setTimeout(() => refetchAttendance(), 100);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All Present
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllAbsent}
            className="flex-1"
          >
            Mark All Absent
          </Button>
        </div>

        {/* Student List */}
        {isLoadingEnrollments || isLoadingAttendance ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrollmentsError ? (
          <p className="text-sm text-destructive text-center py-8">
            Failed to load students. Please try again.
          </p>
        ) : (
          <div className="overflow-y-auto max-h-[40vh] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Present</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No students enrolled in this section
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <Checkbox
                          checked={student.status === "present"}
                          onCheckedChange={() => toggleAttendance(student.student_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.student_name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            student.status === "present"
                              ? "bg-green-100 text-green-700"
                              : student.status === "late"
                              ? "bg-yellow-100 text-yellow-700"
                              : student.status === "excused"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {student.status}
                        </span>
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
            {presentCount} / {students.length} present
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
              onClick={handleSaveAttendance}
              disabled={isSaving || students.length === 0}
              className="bg-[#003366] hover:bg-[#00509E]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasExistingData ? 'Update Attendance' : 'Save Attendance'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
