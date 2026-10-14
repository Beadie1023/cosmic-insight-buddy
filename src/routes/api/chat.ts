import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  profile: z.string().max(4000),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(40),
});

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, "That message didn't go through — try again.");
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json(500, "The guide isn't set up yet.");
        const { profile, messages } = parsed.data;

        const instructions = `You are the Guide inside Footing, a calm, grounded numerology and astrology companion. You already know the person's chart (below) — never ask for their birthday or name. Answer their questions through the lens of their specific numbers: life path, name number, personal year, Lo Shu grid, Chinese zodiac and element, Kua number. You can also answer general questions about numerology, astrology, feng shui, the moon, and reflection practices.

Tone: warm, honest, practical, never fearful or fatalistic. Treat these traditions as reflective tools, not guarantees. For medical, legal or financial decisions, gently suggest a qualified professional.

Format: plain text for a phone screen. Short paragraphs. No markdown symbols like #, * or **. Simple dashes for lists are fine. Usually 80-250 words unless they ask for more.

Their chart:
${profile}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            stream: true,
            store: false,
            reasoning: { effort: "low" },
            instructions,
            input: messages.slice(-16).map((m) => ({
              role: m.role,
              content: [{ type: m.role === "user" ? "input_text" : "output_text", text: m.content }],
            })),
          }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const s = upstream.status;
          console.error("chat upstream", s, await upstream.text().catch(() => ""));
          if (s === 429) return json(429, "Too many questions right now — wait a moment and try again.");
          if (s === 402) return json(402, "The guide is out of AI credits for now.");
          if (s === 403) return json(403, "The guide isn't available right now.");
          return json(502, "Something went wrong — try again.");
        }

        const enc = new TextEncoder();
        const dec = new TextDecoder();
        let buf = "";
        const out = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, ctrl) {
              buf += dec.decode(chunk, { stream: true });
              let i;
              while ((i = buf.indexOf("\n\n")) >= 0) {
                const frame = buf.slice(0, i);
                buf = buf.slice(i + 2);
                for (const line of frame.split("\n")) {
                  if (!line.startsWith("data:")) continue;
                  try {
                    const ev = JSON.parse(line.slice(5).trim());
                    if ((ev.type === "response.output_text.delta" || ev.type === "response.refusal.delta") && ev.delta)
                      ctrl.enqueue(enc.encode(ev.delta));
                    if (ev.type === "error" || ev.type === "response.failed")
                      ctrl.enqueue(enc.encode("\n\nSomething went wrong partway through — try again."));
                  } catch {
                    /* ignore */
                  }
                }
              }
            },
          }),
        );
        return new Response(out, {
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache, no-transform" },
        });
      },
    },
  },
});
