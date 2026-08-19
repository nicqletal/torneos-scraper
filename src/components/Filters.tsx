'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Filter, Trophy, Activity } from 'lucide-react'

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

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-6">
      <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-white/10">
        <Filter className="w-4 h-4 text-emerald-400" />
        <span>Filtros</span>
      </div>

      <div>
        <h3 className="font-bold text-sm text-white/90 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          Modalidad
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { value: '', label: 'Todas' },
            { value: 'futbol_5', label: 'Fútbol 5' },
            { value: 'futbol_7', label: 'Fútbol 7' },
            { value: 'futbol_8', label: 'Fútbol 8' },
            { value: 'futbol_11', label: 'Fútbol 11' },
          ].map((mod) => (
            <label key={mod.value} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
              <input
                type="radio"
                name="modality"
                value={mod.value}
                checked={currentModality === mod.value}
                onChange={(e) => updateFilter('modality', e.target.value)}
                className="accent-emerald-500"
              />
              {mod.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm text-white/90 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Estado
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { value: '', label: 'Todos' },
            { value: 'abierto', label: 'Abiertos' },
            { value: 'en_curso', label: 'En curso' },
            { value: 'cerrado', label: 'Cerrados' },
            { value: 'finalizado', label: 'Finalizados' },
          ].map((status) => (
            <label key={status.value} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={currentStatus === status.value}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="accent-emerald-500"
              />
              {status.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
