import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Compass className="mx-auto h-10 w-10 text-signal" />
        <h1 className="mt-4 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white transition hover:bg-signal-hover"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
