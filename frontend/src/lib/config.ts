/** Backend API root, e.g. http://localhost:5000/api */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** Public, embeddable SVG badge URL for a monitor. */
export function badgeUrl(monitorId: string): string {
  return `${API_BASE_URL}/badge/${monitorId}`;
}

/** Markdown snippet for embedding the badge (README etc.). */
export function badgeMarkdown(monitorId: string): string {
  return `![status](${badgeUrl(monitorId)})`;
}
