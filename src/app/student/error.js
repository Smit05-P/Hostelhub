"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function StudentError({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            An unexpected error occurred. Please try again or return to your dashboard.
          </p>
          {process.env.NODE_ENV === "development" && error?.message && (
            <pre className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 text-left overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/student/dashboard"}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
