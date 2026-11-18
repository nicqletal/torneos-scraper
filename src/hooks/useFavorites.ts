'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'torneos_favoritos'
const EVENT = 'matchmaking:favorites-change'

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([])

  const read = useCallback(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      setIds(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
    } catch {
      setIds([])
    }
  }, [])

  useEffect(() => {
    read()
    window.addEventListener(EVENT, read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener(EVENT, read)
      window.removeEventListener('storage', read)
    }
  }, [read])

  const toggle = useCallback((id: string) => {
    const next = ids.includes(id) ? ids.filter((saved) => saved !== id) : [...ids, id]
    setIds(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      window.dispatchEvent(new Event(EVENT))
    } catch { /* State remains usable for this visit if storage is unavailable. */ }
  }, [ids])

  return { ids, toggle, isFavorite: (id: string) => ids.includes(id) }
}
