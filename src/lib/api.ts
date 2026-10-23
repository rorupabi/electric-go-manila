import 'server-only';
import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { UploadError } from '@/lib/storage/upload';

export function jsonInvalid(error: ZodError): NextResponse {
  const issue = error.issues[0];
  const message = issue?.message && !/^(Required|Invalid|Expected)/.test(issue.message)
    ? issue.message
    : 'Please check the form and try again.';
  return NextResponse.json({ error: 'invalid_input', issues: [{ message }] }, { status: 400 });
}

export function jsonError(code: string, status: number): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

/** Maps thrown errors to JSON. Internal details are never sent in production. */
export function jsonRouteError(e: unknown): NextResponse {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === 'UNAUTHENTICATED') return jsonError('unauthenticated', 401);
  if (msg === 'FORBIDDEN') return jsonError('forbidden', 403);
  if (e instanceof UploadError) return jsonError('invalid_file', 400);
  console.error(e);
  return NextResponse.json(
    process.env.NODE_ENV === 'production' ? { error: 'server_error' } : { error: 'server_error', detail: msg },
    { status: 500 },
  );
}
