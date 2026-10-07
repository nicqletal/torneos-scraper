'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Filter, Trophy, Activity, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { SPORT_MODALITIES } from '@/utils/modality'

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

  const currentModality = searchParams.get('modality') || ''
  const currentStatus = searchParams.get('status') || ''

  const modalities = [
    { value: '', label: 'TODAS LAS MODALIDADES' },
    ...SPORT_MODALITIES.map((m) => ({ value: m.value, label: m.label.toUpperCase() })),
  ]

  const statuses = [
    { value: '', label: 'TODOS LOS ESTADOS' },
    { value: 'abierto', label: 'INSCRIPCIÓN ABIERTA' },
    { value: 'en_curso', label: 'EN CURSO' },
    { value: 'cerrado', label: 'INSCRIPCIÓN CERRADA' },
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

    </div>
  )
}
