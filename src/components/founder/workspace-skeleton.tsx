function Bone({ className }: { className: string }) {
  return <div className={`ws-shimmer rounded-xl ${className}`} />;
}

/** Fixed-size Mentor shell used during route loads and chat hydration. */
export function WorkspaceSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#09090B] text-white">
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-white/[0.08] bg-[#18181B]/80 p-3 backdrop-blur-xl md:flex">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-2 pb-2.5 pt-1">
            <Bone className="h-6 w-28" />
            <Bone className="h-5 w-16" />
          </div>
          <Bone className="h-4 w-32" />
          <Bone className="h-9 w-full" />
          <Bone className="h-9 w-full" />
          <Bone className="h-10 w-full" />
          <div className="space-y-2 pt-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-full" />
            <Bone className="h-8 w-full" />
            <Bone className="h-8 w-full" />
          </div>
          <div className="space-y-2 border-t border-white/[0.06] pt-3">
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-full" />
            <Bone className="h-8 w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.06] p-2">
          <Bone className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3 w-24" />
            <Bone className="h-2.5 w-32" />
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
          <Bone className="h-16 w-16 rounded-3xl" />
          <Bone className="h-8 w-72 max-w-full" />
          <Bone className="h-4 w-96 max-w-full" />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Bone className="h-9 w-40" />
            <Bone className="h-9 w-44" />
            <Bone className="h-9 w-40" />
          </div>
        </div>
        <div className="shrink-0 px-4 pb-5 pt-2 md:px-6">
          <Bone className="mx-auto h-[60px] max-w-3xl rounded-[28px]" />
        </div>
      </div>
    </div>
  );
}
