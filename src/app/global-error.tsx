'use client';

import './globals.css';

// Last resort for errors in the root layout itself, so it renders its own <html>.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center p-6">
        <div className="card w-full max-w-md p-8 text-center">
          <p className="font-semibold">Electric Go Manila is having trouble right now.</p>
          <p className="mt-1.5 text-sm text-ink-soft">Try again in a moment.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => retry()} className="btn btn-primary">Try again</button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the layout (and Link) may be what failed */}
            <a href="/" className="btn btn-outline">Go home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
