export const env = {
  qlooKey: () => process.env.QLOO_API_KEY ?? "",
  qlooBase: () => (process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com").replace(/\/+$/, ""),
  qlooMock: () => process.env.QLOO_MOCK === "1" && process.env.NODE_ENV !== "production" && !process.env.VERCEL,
  llmBase: () => process.env.LLM_BASE_URL || "https://api.tokenfactory.nebius.com/v1",
  llmKey: () => process.env.LLM_API_KEY ?? "",
  llmModel: () => process.env.LLM_MODEL || "nvidia/nemotron-3-super-120b-a12b",
  kvUrl: () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  kvToken: () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};
