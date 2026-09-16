"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

// Route-level error boundary. Any uncaught render/data error lands here instead
// of a blank screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-tier-high" />
        <h1 className="mt-4 text-xl font-semibold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          An unexpected error occurred. You can try again — if it keeps
          happening, contact your administrator.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white transition hover:bg-signal-hover"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  );
}
