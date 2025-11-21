'use client'

import { useEffect, useRef } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Component that pings the backend on mount to wake it up from Render cold start
 * This prevents "Failed to fetch" errors when users first load the app
 */
export function BackendWarmup() {
  const hasWarmedUp = useRef(false)

  useEffect(() => {
    // Only warm up once per session
    if (hasWarmedUp.current) return
    hasWarmedUp.current = true

    // Ping health endpoint to wake up Render service
    const warmUp = async () => {
      try {
        console.log('🔥 Warming up backend...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s for cold start
        
        const response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache',
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          console.log('✅ Backend is ready')
        } else {
          console.warn('⚠️ Backend responded with error:', response.status)
        }
      } catch (error) {
        console.warn('⚠️ Backend warmup failed (will retry on first API call):', error)
      }
    }

    warmUp()
  }, [])

  return null // This component doesn't render anything
}
