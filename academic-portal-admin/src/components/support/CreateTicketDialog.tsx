"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Send } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("academic");
  const [priority, setPriority] = useState<string>("medium");
  const [studentId, setStudentId] = useState("");

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: string;
      priority: string;
      student_id: number;
    }) => {
      return await api.createSupportTicket(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
      handleClose();
    },
    onError: (error: Error) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description:
          apiError.response?.data?.detail ||
          "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a ticket subject",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a ticket description",
        variant: "destructive",
      });
      return;
    }

    if (!studentId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a student ID",
        variant: "destructive",
      });
      return;
    }

    const studentIdNum = parseInt(studentId, 10);
    if (isNaN(studentIdNum) || studentIdNum <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid student ID",
        variant: "destructive",
      });
      return;
    }

    if (subject.length > 200) {
      toast({
        title: "Validation Error",
        description: "Subject must be less than 200 characters",
        variant: "destructive",
      });
      return;
    }

    if (description.length > 2000) {
      toast({
        title: "Validation Error",
        description: "Description must be less than 2000 characters",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      student_id: studentIdNum,
    });
  };

  const handleClose = () => {
    setSubject("");
    setDescription("");
    setCategory("academic");
    setPriority("medium");
    setStudentId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-orange" />
            Create Support Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new support ticket for a student. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogBody className="space-y-5">
          {/* Student ID */}
          <div className="space-y-2">
            <Label htmlFor="student-id">
              Student ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="student-id"
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 1001"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the student&apos;s ID number
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Unable to access course materials"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ticket-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue..."
              className="min-h-[150px] resize-none"
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/2000 characters
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="ticket-category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="ticket-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic Issues</SelectItem>
                <SelectItem value="technical">Technical Support</SelectItem>
                <SelectItem value="financial">Financial/Fees</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="documents">Document Requests</SelectItem>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the most appropriate category
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="ticket-priority">
              Priority Level <span className="text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="ticket-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait a few days</SelectItem>
                <SelectItem value="medium">Medium - Normal response time</SelectItem>
                <SelectItem value="high">High - Needs attention soon</SelectItem>
                <SelectItem value="urgent">Urgent - Immediate action required</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher priority tickets are addressed first
            </p>
          </div>

          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTicketMutation.isPending}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white sm:w-auto w-full"
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
