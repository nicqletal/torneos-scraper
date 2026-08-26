export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-pulse">
      {/* Back link placeholder */}
      <div className="w-32 h-5 bg-brand-surface border border-brand-border rounded-sm" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Flyer placeholder */}
        <div className="lg:col-span-5 h-[500px] bg-brand-surface border border-brand-border rounded-sm" />

        {/* Info placeholders */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="w-3/4 h-12 bg-brand-surface border border-brand-border rounded-sm mb-4" />
            <div className="w-1/2 h-5 bg-brand-surface border border-brand-border rounded-sm" />
          </div>

          <div className="p-6 bg-brand-surface border border-brand-border flex flex-col gap-4 rounded-sm">
            <div>
              <div className="w-32 h-4 bg-brand-secondary border border-brand-border rounded-sm mb-2" />
              <div className="w-48 h-8 bg-brand-secondary border border-brand-border rounded-sm" />
            </div>
            
            <div className="h-px bg-brand-border w-full" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="w-24 h-4 bg-brand-secondary border border-brand-border rounded-sm mb-2" />
                <div className="w-40 h-5 bg-brand-secondary border border-brand-border rounded-sm" />
              </div>
              <div>
                <div className="w-24 h-4 bg-brand-secondary border border-brand-border rounded-sm mb-2" />
                <div className="w-40 h-5 bg-brand-secondary border border-brand-border rounded-sm" />
              </div>
            </div>
          </div>

          <div>
            <div className="w-40 h-6 bg-brand-surface border border-brand-border rounded-sm mb-4" />
            <div className="w-full h-4 bg-brand-surface border border-brand-border rounded-sm mb-2" />
            <div className="w-full h-4 bg-brand-surface border border-brand-border rounded-sm mb-2" />
            <div className="w-3/4 h-4 bg-brand-surface border border-brand-border rounded-sm" />
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1 h-14 bg-brand-surface border border-brand-border rounded-sm" />
            <div className="flex-1 h-14 bg-brand-surface border border-brand-border rounded-sm" />
          </div>
        </div>

      </div>
    </div>
  )
}
