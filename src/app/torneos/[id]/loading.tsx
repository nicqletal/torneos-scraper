export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-pulse">
      <div className="w-32 h-6 bg-white/10 rounded-md" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 h-[500px] rounded-2xl bg-white/5 border border-white/10" />

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="w-3/4 h-10 bg-white/10 rounded-lg mb-4" />
            <div className="w-1/2 h-6 bg-white/10 rounded-md" />
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <div>
              <div className="w-32 h-4 bg-white/10 rounded-md mb-2" />
              <div className="w-48 h-10 bg-white/10 rounded-lg" />
            </div>
            
            <div className="h-px bg-white/10 w-full" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="w-24 h-4 bg-white/10 rounded-md mb-2" />
                <div className="w-40 h-6 bg-white/10 rounded-md" />
              </div>
              <div>
                <div className="w-24 h-4 bg-white/10 rounded-md mb-2" />
                <div className="w-40 h-6 bg-white/10 rounded-md" />
              </div>
            </div>
          </div>

          <div>
            <div className="w-40 h-6 bg-white/10 rounded-md mb-4" />
            <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
            <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
            <div className="w-3/4 h-4 bg-white/10 rounded-md" />
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1 h-14 bg-white/10 rounded-xl" />
            <div className="flex-1 h-14 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
