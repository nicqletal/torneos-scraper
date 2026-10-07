'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the link is visible in the input to copy by hand
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-brand-lime hover:bg-white text-brand-bg transition-colors font-display"
    >
      {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[3]" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
