function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/80 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Bone className="h-8 w-72" />
      <Bone className="mt-3 h-4 w-96" />
      <div className="mt-6 space-y-4 rounded-[24px] border border-line bg-paper-raised p-8">
        <Bone className="h-6 w-48" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Bone className="h-4 w-32" />
            <Bone className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
