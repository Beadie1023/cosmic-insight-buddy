import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  image: z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/).max(21_000_000),
  room: z.string().max(100).default(""),
  door: z.string().max(60).default(""),
  lifePath: z.number().int(),
  lifePathStrength: z.string().max(300).default(""),
  element: z.string().max(20),
  kua: z.number().int().min(1).max(9),
  kuaGroup: z.string().max(10),
  kuaDirection: z.string().max(20),
});

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/fengshui")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, "That photo didn't work — try a JPEG, PNG, WebP or GIF.");
        const d = parsed.data;
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json(500, "The room reader isn't set up yet.");

        const prompt = `You're shown a photo of a ${d.room || "room"} in someone's home. Give a warm, practical feng shui read of this SPECIFIC photo and tell them exactly how to position their things.

Their profile: life path ${d.lifePath}${d.lifePathStrength ? ` (${d.lifePathStrength})` : ""}, Chinese birth element ${d.element}, Kua number ${d.kua} (${d.kuaGroup} group), most favorable direction ${d.kuaDirection}.${d.door ? ` The main door faces: ${d.door}.` : ""}

Cover, grounded in what is actually visible:
1. Commanding position — where the key piece (bed, desk or sofa) is relative to the door, and where to move it.
2. Kua directions — how to orient the bed headboard, desk or seat toward ${d.kuaDirection} or their other ${d.kuaGroup}-group directions, if practical.
3. Bagua — overlay the Bagua from the entry wall and name which life areas look neglected or cluttered.
4. Five elements — which elements show up too much or too little, and colors/materials that support their ${d.element} element.
Finish with the 3 most important concrete moves, in order.

Plain language, warm tone, about 300-450 words. Use short section labels on their own line, no markdown symbols like # or *.`;

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
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: prompt },
                  { type: "input_image", image_url: d.image },
                ],
              },
            ],
          }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const s = upstream.status;
          console.error("fengshui upstream", s, await upstream.text().catch(() => ""));
          if (s === 429) return json(429, "Too many requests right now — wait a moment and try again.");
          if (s === 402) return json(402, "The room reader is out of AI credits for now.");
          if (s === 403) return json(403, "The room reader isn't available right now.");
          return json(502, "Something went wrong reading that photo — try again.");
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
                    if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                    if (ev.type === "response.refusal.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                    if (ev.type === "error" || ev.type === "response.failed")
                      ctrl.enqueue(enc.encode("\n\nSomething went wrong partway through — try again."));
                  } catch {
                    /* ignore non-JSON frames */
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
