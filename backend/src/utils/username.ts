import { prisma } from '../config/db';

/** Turn an arbitrary string into a URL-safe handle. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

/**
 * Generate a username from a base string, appending a short random suffix
 * until it is unique. Falls back to a random handle if the base is empty.
 */
export async function generateUniqueUsername(base: string): Promise<string> {
  let candidate = slugify(base) || `user-${Math.random().toString(36).slice(2, 8)}`;

  // Try the bare slug first, then increasingly random variants.
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    candidate = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Extremely unlikely fallback.
  return `${slugify(base)}-${Date.now().toString(36)}`;
}
