import type { Request } from 'express';

// Tri-state body reader shared by the CRUD validators:
//   undefined → the field is absent from the body (leave unchanged on PATCH)
//   null      → the field was sent as null/'' (clear the value)
//   string    → the trimmed value
// A non-string, non-null value also returns undefined; callers that need to
// distinguish "absent" from "wrong type" check `name in input` first.
export function readBodyString(input: Record<string, unknown>, name: string): string | null | undefined {
  if (!(name in input)) {
    return undefined;
  }
  const value = input[name];
  if (value === null || value === '') {
    return null;
  }
  return typeof value === 'string' ? value.trim() : undefined;
}

// Query params: only non-empty strings count; everything else reads as absent.
export function readQueryString(request: Request, name: string): string | undefined {
  const value = request.query[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
