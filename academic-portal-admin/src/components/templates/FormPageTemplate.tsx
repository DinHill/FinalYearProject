import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';

interface FormPageTemplateProps {
  title: string;
  description?: string;
  onBack?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  saveButtonText?: string;
  children: React.ReactNode;
}

export function FormPageTemplate({
  title,
  description,
  onBack,
  onSave,
  onCancel,
  isLoading = false,
  saveButtonText = 'Save',
  children,
}: FormPageTemplateProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Form Content */}
      <div className="space-y-6">{children}</div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        {onSave && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : saveButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}

// Form Section Component for organizing form fields
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
