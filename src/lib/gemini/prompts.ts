import type { AnalysisResult, ComputedStats } from "../schemas";

// ── Style Anchor (prepended to ALL image generation prompts) ───────

export const STYLE_ANCHOR = `Transform the main broken object in the reference photo into a cute 3D character while keeping the object's original shape, proportions, materials, and recognizable damage details (cracks, dents, missing parts, rust, peeling paint). Add simple kawaii facial features (big expressive eyes, small nose, tiny smiling mouth) directly on the object's surface, and optionally tiny stubby arms/legs that do not change the object's core silhouette.
Style: trendy early-2020s NFT/toy collectible look, high-quality 3D render, smooth rounded edges, subtle plastic/vinyl shading mixed with the object's real material textures.
Background: clean studio setup with pure white or a single soft pastel color, minimal to no props, gentle softbox lighting, soft shadow under the character, slight rim light, global illumination.
Composition: centered hero shot, front 3/4 angle, full object visible, sharp focus, high detail, no text, no watermark.`;

// ── Creative Prompt Builder ────────────────────────────────────────

export function buildCreativePrompt(
  analysis: AnalysisResult,
  stats: ComputedStats,
  integrityToken: string,
): string {
  return `You are a creative monster designer for CivicQuest Seoul (고장몬 도감), a gamified civic infrastructure reporting app.
Given the infrastructure analysis below, create a unique cute monster inspired by the issue.

## CRITICAL RULES
1. Return ONLY valid JSON. No extra text.
2. You MUST copy analysis_echo and stats_echo blocks EXACTLY as provided. Do NOT modify any value.
3. Monster name should be 2-4 Korean syllables, catchy and fun.
4. cry_ssml must be valid SSML <speak>...</speak> lasting ~1 second. Use onomatopoeia.
5. image_prompt_ko describes the monster's appearance for image generation. Do NOT include style instructions (they are added separately). Focus on: body shape, color, features inspired by the infrastructure issue. Describe the broken infrastructure object that will be turned into a character.

## ANALYSIS DATA
- Issue: ${analysis.issue_name_ko} (${analysis.issue_name_en})
- Type: ${analysis.issue_type}
- Inconvenience: ${analysis.inconvenience}/100
- Risk: ${analysis.risk}/100
- Evidence: ${analysis.evidence.join("; ")}

## ECHO BLOCKS (COPY EXACTLY)
analysis_echo: ${JSON.stringify({
    analysis_id: analysis.analysis_id,
    issue_name_ko: analysis.issue_name_ko,
    issue_type: analysis.issue_type,
    inconvenience: analysis.inconvenience,
    risk: analysis.risk,
  })}

stats_echo: ${JSON.stringify({
    impact_score: stats.impact_score,
    rarity: stats.rarity,
    level: stats.level,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    integrity_token: integrityToken,
  })}

## OUTPUT JSON SCHEMA
{
  "analysis_echo": { "analysis_id": "...", "issue_name_ko": "...", "issue_type": "...", "inconvenience": N, "risk": N },
  "stats_echo": { "impact_score": N, "rarity": "...", "level": N, "hp": N, "atk": N, "def": N, "spd": N, "integrity_token": "..." },
  "monster_name_ko": "짧고 귀여운 한국어 이름 (2-4음절)",
  "monster_title_ko": "재미있는 한국어 부제",
  "description_ko": "2-3 문장 한국어 설명",
  "traits_ko": ["특성1", "특성2", "특성3"],
  "weakness_hint_ko": "게임 느낌의 약점 힌트 1문장",
  "image_prompt_ko": "파손된 인프라 객체를 캐릭터로 변환하기 위한 외형 설명",
  "cry_ssml": "<speak>울음소리 SSML</speak>",
  "cry_text_hint": "울음소리 의성어 자막 (예: 삐빗-또각!)"
}`;
}

// ── Image Prompt Builder ───────────────────────────────────────────

export function buildImagePrompt(imagePromptKo: string): string {
  return `${STYLE_ANCHOR}\n\nObject details: ${imagePromptKo}`;
}
