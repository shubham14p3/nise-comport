import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  const status = error instanceof ZodError ? 400 : /not configured|ECONN|connect|SMTP/i.test(message) ? 503 : 400;
  return NextResponse.json({ error: error instanceof ZodError ? "Please check the information and try again." : message }, { status });
}

export function makeReference(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
