/**
 * pages/404.tsx
 *
 * Purpose: Forces Next.js 14.1.x to run the Pages Router server compilation
 * and emit `.next/server/pages-manifest.json`, which is required even for
 * pure App Router projects when `output: 'export'` is set.
 *
 * In Capacitor (mobile) and Tauri (desktop), all routing is handled
 * client-side by the App Router — this file is never shown to users.
 * In the static export it becomes `out/404.html` as a safe fallback.
 */
export default function Custom404() {
    return null;
}
