"use client"

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const queryClient = useQueryClient()

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await api.getUnreadCount()
      return result.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const result = await api.getNotifications(1, 20)
      return result.data
    },
    enabled: isOpen,
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: number) => api.deleteNotification(notificationId),
    onSuccess: () => {
      toast.success('Notification deleted')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => api.clearAllNotifications(),
    onSuccess: () => {
      toast.success('All read notifications cleared')
      setShowClearAllDialog(false)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleMarkRead = (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    markReadMutation.mutate(notificationId)
  }

  const handleDelete = (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(notificationId)
  }

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
    }
  }

  const confirmClearAll = () => {
    clearAllMutation.mutate()
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id)
    }
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const getNotificationIcon = (type: string) => {
    // Different icons based on notification type
    return <Bell className="h-4 w-4" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'normal':
        return 'text-blue-600'
      case 'low':
        return 'text-gray-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadData && unreadData.unread_count > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs"
            >
              {unreadData.unread_count > 99 ? '99+' : unreadData.unread_count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {notificationsData && notificationsData.items && notificationsData.items.some((n: any) => !n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            {notificationsData && notificationsData.items && notificationsData.items.some((n: any) => n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearAllDialog(true)}
                disabled={clearAllMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !notificationsData || notificationsData.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificationsData.items.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent cursor-pointer transition-colors",
                    !notification.is_read && "bg-blue-50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <div className={cn("mt-1", getPriorityColor(notification.priority))}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkRead(notification.id, e)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>

      {/* Delete Single Notification Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Notifications Confirmation */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Read Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all read notifications? This will permanently delete all read notifications and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearAllMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              disabled={clearAllMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearAllMutation.isPending ? 'Clearing...' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  )
}
