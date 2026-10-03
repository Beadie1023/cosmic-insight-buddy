import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Footing — a numerology companion" },
      {
        name: "description",
        content:
          "A quiet, private numerology and astrology companion for practical reflection.",
      },
      { property: "og:title", content: "Footing — a numerology companion" },
      {
        property: "og:description",
        content:
          "A quiet, private numerology and astrology companion for practical reflection.",
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
