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
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Same art: the mark sits inside 62% of the canvas, which clears the
        // inner-80% safe zone a maskable icon is cropped to.
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
