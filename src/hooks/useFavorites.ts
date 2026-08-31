'use client'

import { useState, useEffect } from 'react'

const FAVORITES_KEY = 'torneos_favoritos'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // COMENTARIO: Usamos useEffect para cargar los favoritos desde localStorage
  // solo una vez cuando el componente se monta en el cliente.
  useEffect(() => {
    setIsMounted(true)
    const storedFavorites = localStorage.getItem(FAVORITES_KEY)
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites))
      } catch (e) {
        console.error('Error al parsear favoritos', e)
      }
    }
  }, [])

  // COMENTARIO: Función para alternar el estado de favorito de un torneo específico
  const toggleFavorite = (tournamentId: string) => {
    let newFavorites
    if (favorites.includes(tournamentId)) {
      newFavorites = favorites.filter(id => id !== tournamentId)
    } else {
      newFavorites = [...favorites, tournamentId]
    }
    
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
    
    // COMENTARIO: Despachamos un evento personalizado para que otras pestañas
    // o componentes puedan reaccionar a los cambios en los favoritos.
    window.dispatchEvent(new Event('favoritesChanged'))
  }

  // COMENTARIO: Escuchamos el evento personalizado para mantener sincronizados
  // varios componentes en la misma página que usen este hook.
  useEffect(() => {
    const handleStorageChange = () => {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY)
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites))
      } else {
        setFavorites([])
      }
    }

    window.addEventListener('favoritesChanged', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('favoritesChanged', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return {
    favorites,
    toggleFavorite,
    isFavorite: (id: string) => favorites.includes(id),
    isMounted // COMENTARIO: Exportamos isMounted para evitar problemas de hidratación en Next.js
  }
}
