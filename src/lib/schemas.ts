import { z } from "zod";

// ── Issue Type Enum ────────────────────────────────────────────────
export const IssueTypeEnum = z.enum([
  "pothole",
  "crack",
  "sinkhole",
  "broken_sidewalk",
  "damaged_guardrail",
  "faulty_streetlight",
  "water_leak",
  "debris",
  "broken_sign",
  "accessibility_obstacle",
  "other",
  "none",
]);
export type IssueType = z.infer<typeof IssueTypeEnum>;

// ── Rarity Enum ────────────────────────────────────────────────────
export const RarityEnum = z.enum([
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
]);
export type Rarity = z.infer<typeof RarityEnum>;

// ── Analysis Result ────────────────────────────────────────────────
export const AnalysisResultSchema = z.object({
  analysis_id: z.string(),
  is_valid: z.boolean(),
  issue_name_ko: z.string(),
  issue_name_en: z.string(),
  issue_type: IssueTypeEnum,
  inconvenience: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).min(2).max(4),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ── Computed Stats ─────────────────────────────────────────────────
export const ComputedStatsSchema = z.object({
  impact_score: z.number().int(),
  level: z.number().int(),
  rarity: RarityEnum,
  hp: z.number().int(),
  atk: z.number().int(),
  def: z.number().int(),
  spd: z.number().int(),
});
export type ComputedStats = z.infer<typeof ComputedStatsSchema>;

// ── Creative Result (from Gemini) ──────────────────────────────────
export const CreativeResultSchema = z.object({
  // Echo blocks
  analysis_echo: z.object({
    analysis_id: z.string(),
    issue_name_ko: z.string(),
    issue_type: IssueTypeEnum,
    inconvenience: z.number().int(),
    risk: z.number().int(),
  }),
  stats_echo: z.object({
    impact_score: z.number().int(),
    rarity: RarityEnum,
    level: z.number().int(),
    hp: z.number().int(),
    atk: z.number().int(),
    def: z.number().int(),
    spd: z.number().int(),
    integrity_token: z.string(),
  }),
  // Creative fields
  monster_name_ko: z.string(),
  monster_title_ko: z.string(),
  description_ko: z.string(),
  traits_ko: z.array(z.string()).length(3),
  weakness_hint_ko: z.string(),
  image_prompt_ko: z.string(),
  cry_ssml: z.string(),
  cry_text_hint: z.string(),
});
export type CreativeResult = z.infer<typeof CreativeResultSchema>;

// ── Monster Record (stored in IndexedDB) ───────────────────────────
export const MonsterRecordSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  analysis: AnalysisResultSchema,
  stats: ComputedStatsSchema,
  creative: z.object({
    monster_name_ko: z.string(),
    monster_title_ko: z.string(),
    description_ko: z.string(),
    traits_ko: z.array(z.string()),
    weakness_hint_ko: z.string(),
    cry_text_hint: z.string(),
  }),
  integrity_token: z.string(),
  // Blob keys (stored separately in localforage)
  originalPhotoKey: z.string(),
  monsterImageKey: z.string(),
  audioCryKey: z.string(),
  repairedPhotoKey: z.string().optional(),
});
export type MonsterRecord = z.infer<typeof MonsterRecordSchema>;

// ── Gemini API Analysis JSON Schema (for response_schema) ──────────
export const ANALYSIS_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    analysis_id: { type: "string" as const },
    is_valid: { type: "boolean" as const },
    issue_name_ko: { type: "string" as const },
    issue_name_en: { type: "string" as const },
    issue_type: {
      type: "string" as const,
      enum: IssueTypeEnum.options,
    },
    inconvenience: { type: "integer" as const, minimum: 0, maximum: 100 },
    risk: { type: "integer" as const, minimum: 0, maximum: 100 },
    confidence: { type: "number" as const, minimum: 0, maximum: 1 },
    evidence: {
      type: "array" as const,
      items: { type: "string" as const },
      minItems: 2,
      maxItems: 4,
    },
  },
  required: [
    "analysis_id",
    "is_valid",
    "issue_name_ko",
    "issue_name_en",
    "issue_type",
    "inconvenience",
    "risk",
    "confidence",
    "evidence",
  ],
};
