'use client';

import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ImportStep = 'upload' | 'validating' | 'validation-result' | 'importing' | 'complete';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  row_count: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  total_rows: number;
  message: string;
}

export function ImportUsersDialog({ open, onOpenChange, onImportComplete }: ImportUsersDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClose = () => {
    // Reset state
    setStep('upload');
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setIsDragging(false);
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    setStep('validating');
    
    try {
      const response = await api.validateImportFile('users', selectedFile);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Validation failed');
      }

      setValidationResult(response.data);
      setStep('validation-result');

      if (!response.data.valid) {
        toast({
          title: 'Validation failed',
          description: `Found ${response.data.errors.length} error(s) in the file`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Validation successful',
          description: `${response.data.row_count} rows ready to import`,
        });
      }
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: error instanceof Error ? error.message : 'Failed to validate file',
        variant: 'destructive',
      });
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.valid) return;

    setStep('importing');

    try {
      const response = await api.importUsers(selectedFile, true, false);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Import failed');
      }

      setImportResult(response.data);
      setStep('complete');

      toast({
        title: 'Import complete',
        description: response.data.message,
      });

      // Trigger refresh of user list
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import users',
        variant: 'destructive',
      });
      setStep('validation-result');
    }
  };

  const downloadTemplate = () => {
    // Create CSV template with example data
    // Use campus/major CODES (not IDs) for stability across environments
    const template = `full_name,role,campus_code,major_code,year_entered,email,phone_number
Nguyen Van A,student,H,CS,2025,nguyenvana@gmail.com,+84123456789
Tran Thi B,student,H,SE,2025,tranthib@gmail.com,+84987654321
Le Van C,teacher,D,,,levanc@gmail.com,+84912345678
Pham Thi D,academic_admin,H,,,,+84923456789`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template downloaded',
      description: 'Check your downloads folder for users_import_template.csv',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Users from CSV/Excel</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk import users. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-brand-orange bg-brand-orange/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>

                {selectedFile && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          Selected: <strong>{selectedFile.name}</strong> (
                          {(selectedFile.size / 1024).toFixed(2)} KB)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required columns:</strong> full_name, role
                    <br />
                    <strong>For students:</strong> campus_code, major_code, year_entered (required)
                    <br />
                    <strong>For teachers:</strong> campus_code (required)
                    <br />
                    <strong>Optional columns:</strong> email (personal), phone_number
                    <br />
                    <strong>Valid roles:</strong> student, teacher, admin, super_admin, academic_admin,
                    registrar
                    <br />
                    <br />
                    <strong>Note:</strong> Usernames and passwords are auto-generated. Default password =
                    username.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Validating Step */}
          {step === 'validating' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-brand-orange" />
              <p className="text-sm text-gray-600">Validating file...</p>
            </div>
          )}

          {/* Validation Result Step */}
          {step === 'validation-result' && validationResult && (
            <div className="space-y-4">
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                {validationResult.valid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {validationResult.valid
                    ? `✓ Validation successful: ${validationResult.row_count} rows ready to import`
                    : `✗ Validation failed: ${validationResult.errors.length} error(s) found`}
                </AlertDescription>
              </Alert>

              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-red-600">Errors:</h4>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-yellow-600">Warnings:</h4>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-600">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-brand-orange" />
              <p className="text-sm text-gray-600 mb-4">Importing users...</p>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Complete!</strong>
                  <br />
                  {importResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-gray-600">Imported</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-sm text-gray-600">Skipped</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{importResult.total_rows}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-red-600">
                    Errors during import:
                  </h4>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!selectedFile}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                Validate File
              </Button>
            </>
          )}

          {step === 'validation-result' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setValidationResult(null);
                }}
              >
                Back
              </Button>
              {validationResult?.valid && (
                <Button
                  onClick={handleImport}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  Import Users
                </Button>
              )}
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
