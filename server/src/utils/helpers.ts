export function generateId(): string {
  return crypto.randomUUID();
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function now(): string {
  return new Date().toISOString();
}
