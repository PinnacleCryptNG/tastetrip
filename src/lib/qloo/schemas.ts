import { z } from "zod";

// Derived from docs.qloo.com (Search Entities, Search Tags, Insights API, Schema & Taxonomy).
// Fields are optional + passthrough on purpose: the API returns many verbose fields we ignore.
export const QlooTagSchema = z
  .object({
    id: z.string().optional(),
    tag_id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    subtype: z.string().optional(),
  })
  .passthrough();

export const QlooEntitySchema = z
  .object({
    entity_id: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
    subtype: z.string().optional(),
    types: z.array(z.string()).optional(),
    popularity: z.number().optional(),
    disambiguation: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
    location: z.unknown().optional(),
    tags: z.array(z.unknown()).optional(),
    query: z.unknown().optional(),
  })
  .passthrough();
export type QlooEntity = z.infer<typeof QlooEntitySchema>;

export const InsightsResponseSchema = z
  .object({
    success: z.boolean().optional(),
    results: z
      .object({ entities: z.array(QlooEntitySchema).default([]) })
      .passthrough()
      .default({ entities: [] }),
    query: z.unknown().optional(),
  })
  .passthrough();
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;

export const SearchResponseSchema = z
  .object({
    results: z.union([
      z.array(QlooEntitySchema),
      z.object({ entities: z.array(QlooEntitySchema).default([]) }).passthrough(),
    ]),
  })
  .passthrough();

export const TagsResponseSchema = z
  .object({
    results: z.union([
      z.object({ tags: z.array(QlooTagSchema).default([]) }).passthrough(),
      z.array(QlooTagSchema),
    ]),
  })
  .passthrough();
