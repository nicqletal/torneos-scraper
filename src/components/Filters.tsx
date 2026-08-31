'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Filter, Trophy, Activity, ChevronRight, MapPin, DollarSign, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

export function Filters({ zones = [] }: { zones?: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Removed min/max price handlers

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

  const currentModality = searchParams.get('modality') || ''
  const currentStatus = searchParams.get('status') || ''
  const currentZone = searchParams.get('zone') || ''
  const currentPriceRange = searchParams.get('priceRange') || ''

  const hasActiveFilters = !!(currentModality || currentStatus || currentZone || currentPriceRange)

  const clearFilters = useCallback(() => {
    router.push('/')
  }, [router])

  const modalities = [
    { value: '', label: 'TODAS LAS MODALIDADES' },
    { value: 'futbol_5', label: 'FÚTBOL 5' },
    { value: 'futbol_7', label: 'FÚTBOL 7' },
    { value: 'futbol_8', label: 'FÚTBOL 8' },
    { value: 'futbol_11', label: 'FÚTBOL 11' },
  ]

  const statuses = [
    { value: '', label: 'TODOS LOS ESTADOS' },
    { value: 'abierto', label: 'INSCRIPCIÓN ABIERTA' },
    { value: 'en_curso', label: 'EN CURSO' },
    { value: 'cerrado', label: 'INSCRIPCIÓN CERRADA' },
    { value: 'finalizado', label: 'FINALIZADOS' },
  ]

  return (
    <div className="bg-brand-surface border border-brand-border p-5 flex flex-col gap-6">

      {/* Title Header */}
      <div className="flex items-center gap-2 text-white font-display text-lg tracking-wider pb-3 border-b border-brand-border uppercase font-bold">
        <Filter className="w-4 h-4 text-brand-lime stroke-[2.5]" />
        <span>PANEL DE FILTROS</span>
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
                className={`relative w-full text-left px-3 py-2 text-xs font-display tracking-wider uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${isActive
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
                className={`relative w-full text-left px-3 py-2 text-xs font-display tracking-wider uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${isActive
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

      {/* Zone Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <MapPin className="w-3.5 h-3.5 text-brand-lime" />
          ZONA
        </h3>
        <select
          value={currentZone}
          onChange={(e) => updateFilter('zone', e.target.value)}
          className="w-full bg-brand-secondary/40 text-white border border-brand-border px-3 py-2 text-xs font-display tracking-wider uppercase focus:outline-none focus:border-brand-lime cursor-pointer rounded-sm"
        >
          <option value="" className="bg-brand-surface text-white">TODAS LAS ZONAS</option>
          {zones.map((zone) => (
            <option key={zone} value={zone} className="bg-brand-surface text-white">
              {zone.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display tracking-wider text-xs text-white/50 uppercase flex items-center gap-1.5 font-bold">
          <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
          PRECIO POR EQUIPO (ARS)
        </h3>
        <select
          value={currentPriceRange}
          onChange={(e) => updateFilter('priceRange', e.target.value)}
          className="w-full bg-brand-secondary/40 text-white border border-brand-border px-3 py-2 text-xs font-display tracking-wider uppercase focus:outline-none focus:border-brand-lime cursor-pointer rounded-sm"
        >
          <option value="" className="bg-brand-surface text-white">CUALQUIER PRECIO</option>
          <option value="0-50000" className="bg-brand-surface text-white">0 - 50.000</option>
          <option value="51000-100000" className="bg-brand-surface text-white">51.000 - 100.000</option>
          <option value="101000-150000" className="bg-brand-surface text-white">101.000 - 150.000</option>
          <option value="151000-200000" className="bg-brand-surface text-white">151.000 - 200.000</option>
          <option value="201000-250000" className="bg-brand-surface text-white">201.000 - 250.000</option>
          <option value="251000-300000" className="bg-brand-surface text-white">251.000 - 300.000</option>
        </select>
      </div>

      {/* Clean Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 mt-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 text-xs font-display tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer rounded-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>LIMPIAR FILTROS</span>
        </button>
      )}

    </div>
  )
}
