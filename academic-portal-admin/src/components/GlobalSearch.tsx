'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  User,
  BookOpen,
  FileText,
  Megaphone,
  GraduationCap,
  Calendar,
  Loader2,
  X,
  Clock
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const entityIcons = {
  user: User,
  course: BookOpen,
  enrollment: GraduationCap,
  document: FileText,
  announcement: Megaphone,
  major: GraduationCap,
  section: Calendar,
}

const entityColors = {
  user: 'bg-blue-100 text-blue-700',
  course: 'bg-green-100 text-green-700',
  enrollment: 'bg-purple-100 text-purple-700',
  document: 'bg-orange-100 text-orange-700',
  announcement: 'bg-red-100 text-red-700',
  major: 'bg-indigo-100 text-indigo-700',
  section: 'bg-yellow-100 text-yellow-700',
}

const entityLabels = {
  users: 'Users',
  courses: 'Courses',
  enrollments: 'Enrollments',
  documents: 'Documents',
  announcements: 'Announcements',
  majors: 'Programs',
  sections: 'Sections',
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent_searches')
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse recent searches:', e)
        }
      }
    }
  }, [])

  // Save to recent searches
  const saveToRecentSearches = useCallback((query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5)
    setRecentSearches(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent_searches', JSON.stringify(updated))
    }
  }, [recentSearches])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search query
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return null
      }
      const result = await api.globalSearch(debouncedQuery)
      if (!result.success) {
        throw new Error(result.error || 'Search failed')
      }
      return result.data
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // 30 seconds
  })

  // Handle result click
  const handleResultClick = (url: string, title: string) => {
    saveToRecentSearches(searchQuery)
    onOpenChange(false)
    setSearchQuery('')
    router.push(url)
    toast.success(`Opening ${title}`)
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recent_searches')
    }
  }

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const hasResults = searchData && searchData.total_results > 0
  const showRecentSearches = !searchQuery && recentSearches.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search users, courses, documents, announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        {/* Search Results or Recent Searches */}
        <ScrollArea className="h-96">
          <div className="p-2">
            {/* Recent Searches */}
            {showRecentSearches && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(query)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{query}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchQuery && debouncedQuery && !isLoading && (
              <>
                {hasResults ? (
                  <div className="space-y-4">
                    {Object.entries(searchData.results).map(([entityType, results]) => {
                      if (!results || results.length === 0) return null

                      return (
                        <div key={entityType}>
                          <div className="px-2 py-1 mb-1">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              {entityLabels[entityType as keyof typeof entityLabels]} ({results.length})
                            </h3>
                          </div>
                          {results.map((result) => {
                            const Icon = entityIcons[result.type as keyof typeof entityIcons]
                            const colorClass = entityColors[result.type as keyof typeof entityColors]

                            return (
                              <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleResultClick(result.url, result.title)}
                                className="w-full text-left px-3 py-3 rounded-md hover:bg-accent group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-md ${colorClass} flex-shrink-0`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium truncate group-hover:text-primary">
                                        {result.title}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {result.type}
                                      </Badge>
                                    </div>
                                    {result.subtitle && (
                                      <p className="text-sm text-muted-foreground mb-1">
                                        {result.subtitle}
                                      </p>
                                    )}
                                    {result.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {result.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No results found for &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!searchQuery && !showRecentSearches && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Start typing to search across users, courses, documents...
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <kbd className="px-2 py-1 bg-muted rounded border">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-muted rounded border">K</kbd>
                  <span>to open</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {hasResults && (
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Found {searchData.total_results} result{searchData.total_results !== 1 ? 's' : ''}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
