"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, CalendarIcon, ArrowLeft, Calendar as CalendarDays, Settings, AlertCircle, Save, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CreateSemesterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Basic Info
  const [semesterName, setSemesterName] = useState("");
  const [semesterCode, setSemesterCode] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [description, setDescription] = useState("");

  // Date Ranges
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationStartDate, setRegistrationStartDate] = useState<Date>();
  const [registrationEndDate, setRegistrationEndDate] = useState<Date>();
  const [addDropDeadline, setAddDropDeadline] = useState<Date>();
  const [withdrawalDeadline, setWithdrawalDeadline] = useState<Date>();

  // Fee Structure
  const [tuitionFee, setTuitionFee] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [lateFee, setLateFee] = useState("");

  // Create semester mutation
  const createSemesterMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      academic_year?: string;
      start_date: string;
      end_date: string;
      registration_start?: string;
      registration_end?: string;
    }) => {
      return await api.createSemester(data);
    },
    onSuccess: () => {
      // Invalidate semesters query to refetch data
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-semester'] });
      
      toast({
        title: "Success",
        description: "Semester created successfully",
      });
      router.push("/academics");
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to create semester. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!semesterName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a semester name",
        variant: "destructive",
      });
      return;
    }

    if (!semesterCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a semester code",
        variant: "destructive",
      });
      return;
    }

    if (!academicYear.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the academic year",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Validation Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    if (!endDate) {
      toast({
        title: "Validation Error",
        description: "Please select an end date",
        variant: "destructive",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    createSemesterMutation.mutate({
      code: semesterCode.trim().toUpperCase(),
      name: semesterName.trim(),
      academic_year: academicYear.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      registration_start: registrationStartDate
        ? format(registrationStartDate, "yyyy-MM-dd")
        : undefined,
      registration_end: registrationEndDate
        ? format(registrationEndDate, "yyyy-MM-dd")
        : undefined,
    });
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Management', href: '/academics' },
          { label: 'Semesters', href: '/academics' },
          { label: 'Add New Semester' }
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/academics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure the semester dates and registration periods. All fields marked with <span className="text-destructive">*</span> are required.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <Info className="w-4 h-4 mr-2" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="dates">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Date Ranges
              </TabsTrigger>
              <TabsTrigger value="fees">
                <Settings className="w-4 h-4 mr-2" />
                Fee Structure
              </TabsTrigger>
            </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the fundamental details about the semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Semester Name */}
                <div className="space-y-2">
                  <Label htmlFor="semesterName">
                    Semester Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="semesterName"
                    value={semesterName}
                    onChange={(e) => setSemesterName(e.target.value)}
                    placeholder="e.g., Fall 2024, Spring 2025"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The display name for this semester
                  </p>
                </div>

                {/* Semester Code */}
                <div className="space-y-2">
                  <Label htmlFor="semesterCode">
                    Semester Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="semesterCode"
                    value={semesterCode}
                    onChange={(e) => setSemesterCode(e.target.value.toUpperCase())}
                    placeholder="e.g., FALL2024, SPR2025"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique code identifier (will be uppercase)
                  </p>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">
                    Academic Year <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The academic year this semester belongs to
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional notes or description about this semester..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date Ranges Tab */}
          <TabsContent value="dates">
            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
                <CardDescription>
                  Set up the key dates for the semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Semester Start Date */}
                <div className="space-y-2">
                  <Label>
                    Semester Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Semester End Date */}
                <div className="space-y-2">
                  <Label>
                    Semester End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Registration Start Date */}
                <div className="space-y-2">
                  <Label>Registration Start Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !registrationStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationStartDate ? (
                          format(registrationStartDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={registrationStartDate}
                        onSelect={setRegistrationStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Registration End Date */}
                <div className="space-y-2">
                  <Label>Registration End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !registrationEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationEndDate ? (
                          format(registrationEndDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={registrationEndDate}
                        onSelect={setRegistrationEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Add/Drop Deadline */}
                <div className="space-y-2">
                  <Label>Add/Drop Deadline (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !addDropDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {addDropDeadline ? (
                          format(addDropDeadline, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={addDropDeadline}
                        onSelect={setAddDropDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Withdrawal Deadline */}
                <div className="space-y-2">
                  <Label>Withdrawal Deadline (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !withdrawalDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {withdrawalDeadline ? (
                          format(withdrawalDeadline, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={withdrawalDeadline}
                        onSelect={setWithdrawalDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Structure Tab */}
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>
                  Define the fees for this semester (optional, for reference)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tuition Fee */}
                <div className="space-y-2">
                  <Label htmlFor="tuitionFee">Tuition Fee (USD)</Label>
                  <Input
                    id="tuitionFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    placeholder="e.g., 5000.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Base tuition fee per credit or per semester
                  </p>
                </div>

                {/* Registration Fee */}
                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Registration Fee (USD)</Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    placeholder="e.g., 100.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    One-time registration fee for the semester
                  </p>
                </div>

                {/* Late Fee */}
                <div className="space-y-2">
                  <Label htmlFor="lateFee">Late Payment Fee (USD)</Label>
                  <Input
                    id="lateFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={lateFee}
                    onChange={(e) => setLateFee(e.target.value)}
                    placeholder="e.g., 50.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Penalty for late payment
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Fee information is for reference only and
                    doesn&apos;t directly affect billing. Actual invoices are managed
                    in the Finance section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/academics')}
            disabled={createSemesterMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createSemesterMutation.isPending}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {createSemesterMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Semester
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}
