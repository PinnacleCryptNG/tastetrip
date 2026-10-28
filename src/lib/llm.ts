import "server-only";
import OpenAI from "openai";
import type { z } from "zod";
import { env } from "./env";

let client: OpenAI | null = null;
function llm() {
  if (!env.llmKey()) throw new Error("LLM_API_KEY is not set");
  return (client ??= new OpenAI({ baseURL: env.llmBase(), apiKey: env.llmKey(), timeout: 45000, maxRetries: 1 }));
}

function extractJson(text: string): unknown {
  const t = text.replace(/^[\s\S]*?<\/think>/, "").trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : t;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  return JSON.parse(start >= 0 && end > start ? body.slice(start, end + 1) : body);
}

// Strict-JSON call validated with Zod, retried once with the validation error.
export async function llmJson<T>(schema: z.ZodType<T>, system: string, user: string, maxTokens = 1800): Promise<T> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: `${system}\nRespond with a single JSON object only. No prose, no markdown.` },
    { role: "user", content: user },
  ];
  const nebius = /nebius/i.test(env.llmBase());
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await llm().chat.completions.create({
        model: env.llmModel(),
        messages,
        temperature: attempt === 0 ? 0.4 : 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        ...(nebius ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      } as OpenAI.ChatCompletionCreateParamsNonStreaming);
      const text = res.choices[0]?.message?.content ?? "";
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      lastErr = parsed.error;
      messages.push(
        { role: "assistant", content: text.slice(0, 4000) },
        { role: "user", content: `That JSON failed validation: ${parsed.error.message.slice(0, 800)}. Return corrected JSON only.` },
      );
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("LLM returned invalid JSON");
}
