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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, ArrowLeft, GraduationCap, FileText, Briefcase, AlertCircle, Save } from "lucide-react";

export default function CreateProgramPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Basic Info
  const [programName, setProgramName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [department, setDepartment] = useState("");
  const [degree, setDegree] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  // Requirements & Structure
  const [totalCredits, setTotalCredits] = useState("");
  const [coreCredits, setCoreCredits] = useState("");
  const [electiveCredits, setElectiveCredits] = useState("");
  const [admissionRequirements, setAdmissionRequirements] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");

  // Additional Details
  const [careerProspects, setCareerProspects] = useState("");
  const [tuitionInfo, setTuitionInfo] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: {
      program_name: string;
      program_code: string;
      department?: string;
      degree_level?: string;
      duration_years?: number;
      description?: string;
      total_credits?: number;
    }) => {
      return await api.createProgram(data);
    },
    onSuccess: () => {
      // Invalidate programs query to refetch data
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: "Success",
        description: "Program created successfully",
      });
      router.push("/academics");
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to create program. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!programName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a program name",
        variant: "destructive",
      });
      return;
    }

    if (!programCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a program code",
        variant: "destructive",
      });
      return;
    }

    if (!department.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the department",
        variant: "destructive",
      });
      return;
    }

    if (!degree) {
      toast({
        title: "Validation Error",
        description: "Please select a degree level",
        variant: "destructive",
      });
      return;
    }

    if (!duration) {
      toast({
        title: "Validation Error",
        description: "Please enter the program duration",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(duration) < 1 || parseInt(duration) > 10) {
      toast({
        title: "Validation Error",
        description: "Duration must be between 1 and 10 years",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate({
      program_name: programName.trim(),
      program_code: programCode.trim().toUpperCase(),
      department: department.trim(),
      degree_level: degree,
      duration_years: parseInt(duration),
      description: description.trim() || undefined,
      total_credits: totalCredits ? parseInt(totalCredits) : undefined,
    });
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Management', href: '/academics' },
          { label: 'Programs', href: '/academics' },
          { label: 'Add New Program' }
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
              Complete all required fields marked with <span className="text-destructive">*</span> to create a new academic program.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <GraduationCap className="w-4 h-4 mr-2" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="requirements">
                <FileText className="w-4 h-4 mr-2" />
                Requirements & Structure
              </TabsTrigger>
              <TabsTrigger value="additional">
                <Briefcase className="w-4 h-4 mr-2" />
                Additional Details
              </TabsTrigger>
            </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the fundamental details about the program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Program Name */}
                <div className="space-y-2">
                  <Label htmlFor="programName">
                    Program Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="programName"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The full official name of the program
                  </p>
                </div>

                {/* Program Code */}
                <div className="space-y-2">
                  <Label htmlFor="programCode">
                    Program Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="programCode"
                    value={programCode}
                    onChange={(e) => setProgramCode(e.target.value.toUpperCase())}
                    placeholder="e.g., BSCS, MSBA, PHDE"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique code identifier (will be uppercase)
                  </p>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science, Engineering, Business"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The department offering this program
                  </p>
                </div>

                {/* Degree Level */}
                <div className="space-y-2">
                  <Label htmlFor="degree">
                    Degree Level <span className="text-red-500">*</span>
                  </Label>
                  <Select value={degree} onValueChange={setDegree}>
                    <SelectTrigger id="degree">
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="associate">Associate Degree</SelectItem>
                      <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                      <SelectItem value="master">Master&apos;s Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate/PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duration (Years) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="10"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 4"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard duration to complete the program
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
          </TabsContent>

          {/* Requirements & Structure Tab */}
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Curriculum Structure</CardTitle>
                <CardDescription>
                  Define the academic requirements and credit structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Credits */}
                <div className="space-y-2">
                  <Label htmlFor="totalCredits">Total Credits Required</Label>
                  <Input
                    id="totalCredits"
                    type="number"
                    min="0"
                    value={totalCredits}
                    onChange={(e) => setTotalCredits(e.target.value)}
                    placeholder="e.g., 120"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of credits needed to graduate
                  </p>
                </div>

                {/* Core Credits */}
                <div className="space-y-2">
                  <Label htmlFor="coreCredits">Core/Required Credits</Label>
                  <Input
                    id="coreCredits"
                    type="number"
                    min="0"
                    value={coreCredits}
                    onChange={(e) => setCoreCredits(e.target.value)}
                    placeholder="e.g., 80"
                  />
                  <p className="text-xs text-muted-foreground">
                    Credits from required core courses
                  </p>
                </div>

                {/* Elective Credits */}
                <div className="space-y-2">
                  <Label htmlFor="electiveCredits">Elective Credits</Label>
                  <Input
                    id="electiveCredits"
                    type="number"
                    min="0"
                    value={electiveCredits}
                    onChange={(e) => setElectiveCredits(e.target.value)}
                    placeholder="e.g., 40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Credits from elective courses
                  </p>
                </div>

                {/* Admission Requirements */}
                <div className="space-y-2">
                  <Label htmlFor="admissionRequirements">
                    Admission Requirements
                  </Label>
                  <Textarea
                    id="admissionRequirements"
                    value={admissionRequirements}
                    onChange={(e) => setAdmissionRequirements(e.target.value)}
                    placeholder="List the requirements for admission (GPA, test scores, prerequisites, etc.)"
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Learning Outcomes */}
                <div className="space-y-2">
                  <Label htmlFor="learningOutcomes">Learning Outcomes</Label>
                  <Textarea
                    id="learningOutcomes"
                    value={learningOutcomes}
                    onChange={(e) => setLearningOutcomes(e.target.value)}
                    placeholder="Define what students will learn and achieve upon completion..."
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Details Tab */}
          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Optional details about careers, costs, and contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Career Prospects */}
                <div className="space-y-2">
                  <Label htmlFor="careerProspects">Career Prospects</Label>
                  <Textarea
                    id="careerProspects"
                    value={careerProspects}
                    onChange={(e) => setCareerProspects(e.target.value)}
                    placeholder="Describe potential career paths and opportunities for graduates..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Tuition Information */}
                <div className="space-y-2">
                  <Label htmlFor="tuitionInfo">Tuition & Financial Information</Label>
                  <Textarea
                    id="tuitionInfo"
                    value={tuitionInfo}
                    onChange={(e) => setTuitionInfo(e.target.value)}
                    placeholder="Include tuition costs, scholarship opportunities, payment plans..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Contact Information</Label>
                  <Textarea
                    id="contactInfo"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Program coordinator email, phone, office location..."
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Additional details are optional but help
                    provide prospective students with comprehensive information about
                    the program.
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
            disabled={createProgramMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProgramMutation.isPending}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {createProgramMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Program
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}
