import { STAGES } from "@/lib/types";

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/80 ${className}`} />;
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[22px] border border-line bg-paper-raised p-5"
          >
            <Bone className="h-3 w-24" />
            <Bone className="mt-4 h-9 w-16" />
            <Bone className="mt-3 h-3 w-36" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[24px] border border-line bg-paper-raised p-6">
          <Bone className="h-7 w-40" />
          <Bone className="mt-2 h-3 w-56" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[110px_1fr_32px] items-center gap-3">
                <Bone className="h-3 w-20" />
                <Bone className="h-2 w-full rounded-full" />
                <Bone className="h-3 w-6 justify-self-end" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-line bg-paper-raised p-6">
          <Bone className="h-7 w-44" />
          <Bone className="mt-2 h-3 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-line px-3 py-3">
                <Bone className="h-3.5 w-32" />
                <Bone className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-line bg-paper-raised p-6">
          <Bone className="h-7 w-44" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Bone className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-3.5 w-36" />
                  <Bone className="h-3 w-48" />
                </div>
                <Bone className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-line bg-paper-raised p-6">
          <Bone className="h-7 w-36" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-line p-4">
                <Bone className="h-3.5 w-44" />
                <Bone className="mt-2 h-3 w-32" />
                <Bone className="mt-3 h-3 w-28" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="flex min-h-0 h-full flex-1 flex-col">
      <Bone className="mb-4 h-4 w-80 shrink-0" />
      <div className="flex min-h-0 flex-1 items-stretch gap-4 overflow-hidden">
        {STAGES.map((stage) => (
          <section
            key={stage.id}
            className="flex h-full w-[280px] shrink-0 flex-col rounded-[24px] border border-line bg-paper-raised/70"
          >
            <header className="flex shrink-0 items-center justify-between px-4 py-4">
              <div className="space-y-2">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-3 w-28" />
              </div>
              <Bone className="h-5 w-8 rounded-full" />
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-line bg-paper-raised p-3"
                >
                  <div className="flex items-start gap-3">
                    <Bone className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Bone className="h-3.5 w-28" />
                      <Bone className="h-3 w-36" />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <Bone className="h-3 w-16" />
                    <Bone className="h-3 w-14" />
                  </div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 4 }).map((__, bar) => (
                      <Bone key={bar} className="h-1 flex-1 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({
  filters = false,
  rows = 8,
}: {
  filters?: boolean;
  rows?: number;
}) {
  return (
    <div>
      {filters ? (
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <Bone className="h-11 flex-1 rounded-2xl" />
          <Bone className="h-11 w-full rounded-2xl lg:w-52" />
          <Bone className="h-11 w-full rounded-2xl lg:w-64" />
        </div>
      ) : (
        <div className="mb-6 flex items-end justify-between gap-4">
          <Bone className="h-4 w-72" />
          <Bone className="h-10 w-36 rounded-full" />
        </div>
      )}
      <div className="overflow-hidden rounded-[24px] border border-line bg-paper-raised">
        <div className="flex gap-6 border-b border-line bg-paper px-4 py-3.5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Bone key={index} className="h-3 w-24 shrink-0" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-line/80 px-4 py-4 last:border-b-0"
          >
            <div className="flex min-w-[180px] items-center gap-2.5">
              {filters ? <Bone className="h-8 w-8 shrink-0 rounded-full" /> : null}
              <Bone className="h-3.5 w-28" />
            </div>
            <Bone className="h-3.5 w-36" />
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-24" />
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
