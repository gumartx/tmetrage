export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function getImageUrl(path?: string | null) {
  if (!path) return undefined;

  if (path.startsWith("http")) return path;

  return `${API_BASE_URL}/${path}`;
}