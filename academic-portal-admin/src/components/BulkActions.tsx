'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, Trash2, Edit, CheckCircle, XCircle, Download } from 'lucide-react'
import { toast } from 'sonner'

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  requiresConfirmation?: boolean
  confirmTitle?: string
  confirmDescription?: string
  onAction: (selectedIds: number[]) => Promise<void>
}

interface BulkActionsProps {
  selectedIds: number[]
  totalCount: number
  onSelectAll: (checked: boolean) => void
  actions: BulkAction[]
  entityName?: string
}

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  actions,
  entityName = 'items'
}: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const allSelected = selectedIds.length === totalCount && totalCount > 0
  const someSelected = selectedIds.length > 0 && selectedIds.length < totalCount

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action)
      return
    }

    await executeAction(action)
  }

  const executeAction = async (action: BulkAction) => {
    setIsLoading(true)
    try {
      await action.onAction(selectedIds)
      toast.success(`Successfully processed ${selectedIds.length} ${entityName}`)
    } catch (error) {
      toast.error(`Failed to process ${entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected || someSelected}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
            className={someSelected ? 'data-[state=checked]:bg-gray-400' : ''}
          />
          <span className="text-sm text-gray-600">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `Select all ${totalCount}`}
          </span>
        </div>

        {/* Bulk Actions Dropdown */}
        {selectedIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                Bulk Actions ({selectedIds.length} {entityName})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleAction(action)}
                  className={action.variant === 'destructive' ? 'text-red-600' : ''}
                  disabled={isLoading}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirmTitle || 'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription ||
                `Are you sure you want to perform this action on ${selectedIds.length} ${entityName}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeAction(confirmAction)}
              disabled={isLoading}
              className={confirmAction?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Common bulk action presets
export const commonBulkActions = {
  delete: (onDelete: (ids: number[]) => Promise<void>): BulkAction => ({
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmTitle: 'Delete Items',
    confirmDescription: 'This will permanently delete the selected items. This action cannot be undone.',
    onAction: onDelete
  }),

  approve: (onApprove: (ids: number[]) => Promise<void>): BulkAction => ({
    label: 'Approve Selected',
    icon: <CheckCircle className="h-4 w-4" />,
    onAction: onApprove
  }),

  reject: (onReject: (ids: number[]) => Promise<void>): BulkAction => ({
    label: 'Reject Selected',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmTitle: 'Reject Items',
    confirmDescription: 'This will reject the selected items.',
    onAction: onReject
  }),

  export: (onExport: (ids: number[]) => Promise<void>): BulkAction => ({
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    onAction: onExport
  }),

  updateStatus: (status: string, onUpdate: (ids: number[]) => Promise<void>): BulkAction => ({
    label: `Set Status: ${status}`,
    icon: <Edit className="h-4 w-4" />,
    onAction: onUpdate
  })
}

// Hook for managing bulk selection state
export function useBulkSelection<T extends { id: number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const selectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map(item => item.id) : [])
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const isSelected = (id: number) => selectedIds.includes(id)

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected
  }
}
