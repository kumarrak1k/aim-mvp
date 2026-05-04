import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Career Mentor",
    short_name: "AI Career",
    description:
      "AI interview coaching for answers, voice delivery and camera presence.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07030d",
    theme_color: "#07030d",
    orientation: "portrait-primary",
    categories: ["education", "productivity", "business"],
    lang: "en-GB",
    icons: [
      {
        src: "/brand/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/brand/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/brand/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
