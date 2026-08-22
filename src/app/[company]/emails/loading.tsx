function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/80 ${className}`} />;
}

export default function Loading() {
  return (
    <div>
      <Bone className="h-4 w-80" />
      <div className="mt-6 flex gap-2">
        <Bone className="h-9 w-24 rounded-full" />
        <Bone className="h-9 w-32 rounded-full" />
        <Bone className="h-9 w-36 rounded-full" />
      </div>
      <div className="mt-6 rounded-[24px] border border-line bg-paper-raised p-6">
        <Bone className="h-8 w-48" />
        <Bone className="mt-6 h-11 w-full" />
        <Bone className="mt-4 h-56 w-full" />
      </div>
    </div>
  );
}
