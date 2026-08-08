import type { MetadataRoute } from "next";

/**
 * Served at /manifest.webmanifest. Generated rather than static so the icon
 * routes stay in one place — see icon.tsx and apple-icon.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARVEN",
    short_name: "ARVEN",
    description: "התמונה המלאה של הבריאות שלך.",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F4F1",
    theme_color: "#F6F4F1",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
