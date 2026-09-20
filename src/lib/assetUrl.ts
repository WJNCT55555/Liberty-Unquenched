/**
 * Resolves a `public/` asset path against Vite's BASE_URL.
 *
 * The game is deployed under a repository sub-path on GitHub Pages
 * (`.github/workflows/deploy.yml` sets VITE_BASE_PATH), so a raw `img/...`
 * string only works on the dev server and 404s on the deployed site.
 */
export const getImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = (import.meta as any).env?.BASE_URL || '/';
  if (url.startsWith(base)) return url;
  if (url.startsWith('/')) return url;
  return `${base}${url}`;
};
