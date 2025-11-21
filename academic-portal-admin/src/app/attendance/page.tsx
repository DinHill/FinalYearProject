"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { CalendarIcon, CheckCircle2, XCircle, Clock, UserX, Pencil, Trash2, Search, Filter, Users, UserCheck, AlertTriangle } from 'lucide-react'
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { SmartPagination } from '@/components/ui/smart-pagination'

export default function AttendancePage() {
  const [page, setPage] = useState(1)
  const [searchDate, setSearchDate] = useState<Date>()
  const [statusFilter, setStatusFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState<number | undefined>()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const queryClient = useQueryClient()

  // Fetch attendance records
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', page, sectionFilter, statusFilter, searchDate],
    queryFn: () => api.getAttendance(
      page,
      20,
      sectionFilter,
      undefined,
      searchDate ? format(searchDate, 'yyyy-MM-dd') : undefined,
      statusFilter || undefined
    ),
  })

  const totalItems = attendanceData?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / 20);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.updateAttendance(id, data),
    onSuccess: () => {
      toast.success('Attendance updated successfully')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast.error('Failed to update attendance')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAttendance(id),
    onSuccess: () => {
      toast.success('Attendance record deleted')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => {
      toast.error('Failed to delete attendance record')
    },
  })

  const handleEdit = (record: any) => {
    setSelectedAttendance(record)
    setEditStatus(record.status)
    setEditNotes(record.notes || '')
    setIsEditDialogOpen(true)
  }

  const handleDelete = (record: any) => {
    setSelectedAttendance(record)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdate = () => {
    if (selectedAttendance) {
      updateMutation.mutate({
        id: selectedAttendance.id,
        data: {
          status: editStatus,
          notes: editNotes,
        },
      })
    }
  }

  const handleDeleteConfirm = () => {
    if (selectedAttendance) {
      deleteMutation.mutate(selectedAttendance.id)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'excused':
        return <UserX className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      present: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Present' },
      absent: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Absent' },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Late' },
      excused: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Excused' },
    }
    const variant = variants[status] || variants.present
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {variant.label}
      </Badge>
    )
  }

  // Calculate statistics
  const stats = attendanceData?.data?.items?.reduce(
    (acc: { total: number; present: number; absent: number; late: number; excused: number }, record) => {
      acc.total++
      if (record.status === 'present') acc.present++
      if (record.status === 'absent') acc.absent++
      if (record.status === 'late') acc.late++
      if (record.status === 'excused') acc.excused++
      return acc
    },
    { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
  ) || { total: 0, present: 0, absent: 0, late: 0, excused: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">
          Track and manage student attendance records
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All attendance records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% absence rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late/Excused</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late + stats.excused}</div>
            <p className="text-xs text-muted-foreground">
              Late: {stats.late} | Excused: {stats.excused}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="date-filter">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-filter"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchDate ? format(searchDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={searchDate}
                    onSelect={setSearchDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchDate(undefined)
                  setStatusFilter('')
                  setPage(1)
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : attendanceData?.data?.items?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Enrollment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData?.data?.items?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>{record.enrollment_id}</TableCell>
                      <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {record.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <SmartPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={20}
                itemName="records"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance status and notes for this record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Date:</strong> {format(new Date(selectedAttendance.date), 'PPP')}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {selectedAttendance.status}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
