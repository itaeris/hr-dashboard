import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">404</p>
      <h1 className="mt-3 font-display text-4xl">Company not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Choose Aeris Beaute or From This Island from the home page.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
      >
        Back to brand picker
      </Link>
    </div>
  );
}
