'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import type { DocumentRequest } from '@/lib/api';

interface ViewDocumentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DocumentRequest | null;
  onUpdateStatus?: () => void;
  onUploadDocument?: () => void;
}

export function ViewDocumentRequestDialog({
  open,
  onOpenChange,
  request,
  onUpdateStatus,
  onUploadDocument,
}: ViewDocumentRequestDialogProps) {
  if (!request) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Pending
        </Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Processing
        </Badge>;
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Ready
        </Badge>;
      case 'delivered':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Delivered
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      transcript: 'Official Transcript',
      certificate: 'Certificate',
      recommendation_letter: 'Recommendation Letter',
      enrollment_verification: 'Enrollment Verification',
      other: 'Other Document',
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Request Details
          </DialogTitle>
          <DialogDescription>
            Request ID: #{request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Status</p>
              <div className="mt-1">
                {getStatusBadge(request.status)}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onUpdateStatus?.();
                onOpenChange(false);
              }}
            >
              Update Status
            </Button>
          </div>

          <Separator />

          {/* Student Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Student ID</p>
                <p className="font-medium">{request.student_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Student Code</p>
                <p className="font-medium">STU{String(request.student_id).padStart(4, '0')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Document Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Document Type</p>
                <p className="text-sm font-medium">{getDocumentTypeName(request.document_type)}</p>
              </div>
              
              {request.purpose && (
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="text-sm">{request.purpose}</p>
                </div>
              )}

              {request.copies_requested && (
                <div>
                  <p className="text-sm text-muted-foreground">Copies Requested</p>
                  <p className="text-sm font-medium">{request.copies_requested}</p>
                </div>
              )}

              {request.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted p-2 rounded">{request.notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested</span>
                <span className="font-medium">{formatDate(request.requested_at)}</span>
              </div>
              {request.processed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processed</span>
                  <span className="font-medium">{formatDate(request.processed_at)}</span>
                </div>
              )}
              {request.ready_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ready</span>
                  <span className="font-medium">{formatDate(request.ready_at)}</span>
                </div>
              )}
              {request.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered</span>
                  <span className="font-medium">{formatDate(request.delivered_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee Information */}
          {request.fee_amount && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Fee Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fee Amount</p>
                    <p className="font-medium font-mono">
                      ₫{request.fee_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    {request.fee_paid ? (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Delivery Information */}
          {request.delivery_method && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Delivery Method</p>
                    <p className="font-medium capitalize">{request.delivery_method}</p>
                  </div>
                  {request.delivery_address && (
                    <div>
                      <p className="text-muted-foreground">Delivery Address</p>
                      <p className="text-sm bg-muted p-2 rounded">{request.delivery_address}</p>
                    </div>
                  )}
                  {request.tracking_number && (
                    <div>
                      <p className="text-muted-foreground">Tracking Number</p>
                      <p className="font-medium font-mono">{request.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {request.status !== 'delivered' && request.status !== 'cancelled' && (
              <Button
                className="flex-1"
                onClick={() => {
                  onUploadDocument?.();
                  onOpenChange(false);
                }}
              >
                Upload Document
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
