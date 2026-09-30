'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Filter, Trophy, Activity, ChevronRight, MapPin, DollarSign, X, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Reset page when filters change
      params.delete('page')
      
      router.push(`/?${params.toString()}`)
    },
    [searchParams, router]
  )

  const clearAllFilters = useCallback(() => {
    router.push('/')
  }, [router])

  const currentModality = searchParams.get('modality') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentZone = searchParams.get('zone') || ''
  const currentMaxPrice = searchParams.get('precio_max') || ''

  // 1. Mostrar filtros activos como CHIPS y opción de Limpiar
  const activeFiltersCount = Array.from(searchParams.keys()).filter(k => k !== 'page').length

  const modalities = [
    { value: '', label: 'TODAS LAS MODALIDADES' },
    { value: 'futbol_5', label: 'FÚTBOL 5' },
    { value: 'futbol_7', label: 'FÚTBOL 7' },
    { value: 'futbol_8', label: 'FÚTBOL 8' },
    { value: 'futbol_11', label: 'FÚTBOL 11' },
  ]

  const statuses = [
    { value: '', label: 'VIGENTES (Ocultar Finalizados)' }, // Adaptado a la regla de excluir finalizados por defecto
    { value: 'abierto', label: 'INSCRIPCIÓN ABIERTA' },
    { value: 'en_curso', label: 'EN CURSO' },
    { value: 'cerrado', label: 'INSCRIPCIÓN CERRADA' },
    { value: 'finalizado', label: 'FINALIZADOS' },
  ]

  // Lista cerrada de Zonas
  const zones = [
    { value: '', label: 'TODAS LAS ZONAS' },
    { value: 'caba', label: 'CABA' },
    { value: 'gba_norte', label: 'GBA NORTE' },
    { value: 'gba_sur', label: 'GBA SUR' },
    { value: 'gba_oeste', label: 'GBA OESTE' },
  ]

  return (
    <div className="bg-brand-surface border border-brand-border p-5 flex flex-col gap-6">
      
      {/* Title Header */}
      <div className="flex flex-col gap-4 pb-3 border-b border-brand-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-display text-lg tracking-wider uppercase font-bold">
            <Filter className="w-4 h-4 text-brand-lime stroke-[2.5]" />
            <span>PANEL DE FILTROS</span>
          </div>
          
          {/* Botón Limpiar Filtros */}
          {activeFiltersCount > 0 && (
            <button 
              onClick={clearAllFilters}
              className="text-[10px] uppercase font-mono tracking-wider text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Chips de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from(searchParams.entries()).map(([key, value]) => {
              if (key === 'page') return null
              return (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-secondary border border-brand-border text-[9px] uppercase font-mono text-brand-lime rounded-sm">
                  {key}: {value}
                  <button onClick={() => updateFilter(key, '')} className="text-white/50 hover:text-red-400 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. ZONA (Agregado según UC-09) */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <MapPin className="w-3.5 h-3.5 text-brand-lime" />
          ZONA
        </h3>
        <div className="flex flex-col gap-1.5">
          {zones.map((zone) => {
            const isActive = currentZone === zone.value
            return (
              <button
                key={zone.value}
                onClick={() => updateFilter('zone', zone.value)}
                className={`relative w-full text-left px-3 py-2 text-xs font-display tracking-wider uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? 'bg-brand-lime text-brand-bg border-brand-lime font-bold'
                    : 'bg-brand-secondary/40 text-white/80 hover:text-white border-brand-border hover:bg-brand-secondary'
                }`}
              >
                <span>{zone.label}</span>
                {isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modality Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <Trophy className="w-3.5 h-3.5 text-brand-lime" />
          MODALIDAD DE JUEGO
        </h3>
        
        <div className="flex flex-col gap-1.5">
          {modalities.map((mod) => {
            const isActive = currentModality === mod.value
            return (
              <button
                key={mod.value}
                onClick={() => updateFilter('modality', mod.value)}
                className={`relative w-full text-left px-3 py-2 text-xs font-display tracking-wider uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? 'bg-brand-lime text-brand-bg border-brand-lime font-bold'
                    : 'bg-brand-secondary/40 text-white/80 hover:text-white border-brand-border hover:bg-brand-secondary'
                }`}
              >
                <span>{mod.label}</span>
                {isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <Activity className="w-3.5 h-3.5 text-brand-lime" />
          ESTADO DE INSCRIPCIÓN
        </h3>

        <div className="flex flex-col gap-1.5">
          {statuses.map((status) => {
            const isActive = currentStatus === status.value
            return (
              <button
                key={status.value}
                onClick={() => updateFilter('status', status.value)}
                className={`relative w-full text-left px-3 py-2 text-xs font-display tracking-wider uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? 'bg-brand-lime text-brand-bg border-brand-lime font-bold'
                    : 'bg-brand-secondary/40 text-white/80 hover:text-white border-brand-border hover:bg-brand-secondary'
                }`}
              >
                <span>{status.label}</span>
                {isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. PRECIO MÁXIMO (Agregado según UC-09) */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
          PRECIO MÁXIMO ($)
        </h3>
        <div className="relative">
          <input
            type="number"
            placeholder="Ej: 50000"
            value={currentMaxPrice}
            onChange={(e) => updateFilter('precio_max', e.target.value)}
            className="w-full bg-brand-bg border border-brand-border text-white px-3 py-2 text-sm font-mono focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime rounded-sm"
          />
        </div>
      </div>

    </div>
  )
}