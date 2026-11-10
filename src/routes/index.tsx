import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [
      {
        children:
          "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}",
      },
    ],
    meta: [
      { name: "theme-color", content: "#1B2438" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Footing" },
      { title: "Footing — a numerology companion" },
      {
        name: "description",
        content:
          "A quiet numerology and astrology companion for practical reflection. Your reading is calculated in your browser.",
      },
      { property: "og:title", content: "Footing — a numerology companion" },
      {
        property: "og:description",
        content:
          "A quiet numerology and astrology companion for practical reflection. Your reading is calculated in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-dvh min-h-screen w-full overflow-hidden bg-background">
      <iframe
        title="Footing — a numerology companion"
        src="/footing.html"
        className="h-full w-full border-0"
      />
    </main>
  );
}
