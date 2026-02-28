import { getSettings } from "../storage";
import { type AnalysisResult, AnalysisResultSchema, type CreativeResult, CreativeResultSchema } from "../schemas";
import type { ZodSchema } from "zod";
import { GoogleGenAI } from "@google/genai";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Generic Gemini JSON call with Zod validation + retry ───────────

export async function callGeminiJSON<T>(
  model: string,
  parts: GeminiPart[],
  zodSchema: ZodSchema<T>,
  jsonSchema?: Record<string, unknown>,
  retryCount = 0,
): Promise<T> {
  const settings = getSettings();
  if (!settings.apiKey) throw new Error("API 키가 설정되지 않았습니다. Settings에서 Gemini API 키를 입력해주세요.");

  const url = `${BASE_URL}/${model}:generateContent?key=${settings.apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: {
      response_mime_type: "application/json",
      ...(jsonSchema ? { response_schema: jsonSchema } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Gemini API에서 텍스트 응답이 없습니다.");

  try {
    const parsed = JSON.parse(text);
    const validated = zodSchema.parse(parsed);
    return validated;
  } catch (e) {
    if (retryCount < 1) {
      // Retry with corrective prompt
      const retryParts: GeminiPart[] = [
        ...parts,
        { text: "\n\n[SYSTEM CORRECTION] Your previous response was not valid JSON matching the required schema. Return ONLY valid JSON matching the exact schema. No extra text." },
      ];
      return callGeminiJSON(model, retryParts, zodSchema, jsonSchema, retryCount + 1);
    }
    throw new Error(`JSON 파싱/검증 실패: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── Analysis call ──────────────────────────────────────────────────

export async function callAnalysis(imageBase64: string, mimeType: string): Promise<AnalysisResult> {
  const { analysisModel } = getSettings();

  const parts: GeminiPart[] = [
    {
      inline_data: {
        mime_type: mimeType,
        data: imageBase64,
      },
    },
    { text: ANALYSIS_PROMPT },
  ];

  return callGeminiJSON(
    analysisModel,
    parts,
    AnalysisResultSchema,
    undefined, // Let model follow prompt instructions
  );
}

// ── Creative call ──────────────────────────────────────────────────

export async function callCreative(
  promptText: string,
): Promise<CreativeResult> {
  const { analysisModel } = getSettings();

  const parts: GeminiPart[] = [{ text: promptText }];

  return callGeminiJSON(analysisModel, parts, CreativeResultSchema);
}

// ── Image generation ───────────────────────────────────────────────

export async function callGeminiImage(
  prompt: string,
  originalPhotoBase64?: string,
  originalPhotoMime?: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
): Promise<Blob> {
  const settings = getSettings();
  if (!settings.apiKey) throw new Error("API 키가 설정되지 않았습니다.");

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  const parts: any[] = [];
  if (originalPhotoBase64 && originalPhotoMime) {
    parts.push({
      inlineData: {
        mimeType: originalPhotoMime,
        data: originalPhotoBase64,
      },
    });
  }
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: settings.imageModel || "gemini-2.5-flash-image",
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        // @ts-expect-error - aspectRatio is valid for image models but not yet typed
        aspectRatio: aspectRatio,
      },
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    const candidate = response.candidates?.[0];
    const imgPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith("image/")
    );

    if (!imgPart?.inlineData?.data) {
      throw new Error("이미지 생성 결과가 없습니다.");
    }

    const binary = atob(imgPart.inlineData.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: imgPart.inlineData.mimeType || "image/jpeg" });
  } catch (e: any) {
    throw new Error(`이미지 생성 오류: ${e.message}`);
  }
}

// ── TTS call ───────────────────────────────────────────────────────

export async function callGeminiTTS(ssml: string): Promise<Blob> {
  const settings = getSettings();
  if (!settings.apiKey) throw new Error("API 키가 설정되지 않았습니다.");

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  try {
    const response = await ai.models.generateContent({
      model: settings.ttsModel || "gemini-2.5-flash-preview-tts",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: settings.ttsVoice || "Kore",
            },
          },
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: ssml }],
        },
      ],
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/")
    );

    if (!audioPart?.inlineData?.data) {
      throw new Error("TTS 오디오 생성 결과가 없습니다.");
    }

    const rawData = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || "audio/pcm";

    // If it's already a standard wav or similar, just decode
    if (mimeType.includes("wav") || mimeType.includes("mp3")) {
      const binary = atob(rawData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mimeType });
    }

    // Otherwise (likely PCM), manually build WAV header
    return buildWavBlob(rawData, mimeType);
  } catch (e: any) {
    throw new Error(`TTS 오류: ${e.message}`);
  }
}

// ── WAV Conversion Utils (Browser safe) ────────────────────────────

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function buildWavBlob(rawDataBase64: string, mimeType: string): Blob {
  const options = parseMimeType(mimeType);
  // Decode base64 to Uint8Array
  const binary = atob(rawDataBase64);
  const dataBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    dataBytes[i] = binary.charCodeAt(i);
  }

  const wavHeader = createWavHeader(dataBytes.length, options);

  // Combine header and data
  const fullWav = new Uint8Array(wavHeader.length + dataBytes.length);
  fullWav.set(wavHeader, 0);
  fullWav.set(dataBytes, wavHeader.length);

  return new Blob([fullWav], { type: "audio/wav" });
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const parts = mimeType.split(";").map((s) => s.trim());
  const fileType = parts[0];
  const params = parts.slice(1);
  
  const format = fileType.split("/")[1];

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 24000, // Gemini TTS default if missing
    bitsPerSample: 16, // Typical for L16
  };

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true); // ChunkSize
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);             // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

// ── Helper: Resize image to max 720p and return base64 ─────────────

export async function resizeAndBase64(file: File, maxDim = 720): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down to fit within maxDim
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Types ──────────────────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

// ── Analysis Prompt (imported inline) ──────────────────────────────

const ANALYSIS_PROMPT = `당신은 도시 인프라 점검 전문 AI입니다. 제공된 사진을 분석하여 인프라 결함이나 위험 요소를 파악하세요.
모든 출력은 반드시 한국어로 작성하세요.

## 핵심 규칙
1. 오직 유효한 JSON만 반환. 다른 텍스트나 마크다운 없이.
2. 사진의 객체가 "도시 인프라 결함(파손된 시설물, 위험 요소 등)"에 해당하는 경우에만 is_valid를 true로 설정하세요. 인물, 동물, 일반풍경, 정상적인 물건 등은 is_valid: false로 설정하세요. is_valid가 false인 경우 issue_type은 "none"으로, 점수들은 0으로 지정하세요.
3. 점수는 보수적으로 매길 것. 대부분 20-60 범위. 심각한 경우(대형 싱크홀, 붕괴)만 70 이상.
4. 모든 evidence 항목은 사진에서 실제로 보이는 것만 서술. 추측 금지.
5. issue_type은 enum 중 정확히 하나만 선택.

## 점수 기준
| 점수 범위 | 불편도(inconvenience) | 위험도(risk) |
|-----------|----------------------|-------------|
| 0-19      | 미미한 외관 문제 | 안전 우려 없음 |
| 20-39     | 눈에 띄지만 통행 가능 | 가벼운 넘어짐 위험 |
| 40-59     | 우회 또는 속도 저하 유발 | 중간 정도 부상 가능 |
| 60-79     | 일상 통행에 심각한 지장 | 미보수 시 부상 가능성 높음 |
| 80-100    | 지역 사용 불가, 긴급 | 생명 위협, 즉각 조치 필요 |

## 퓨샷 예시

예시 1 - 보도블록 작은 균열:
예시 3 - 파손된 가드레일:
{"analysis_id":"SEOUL-2026-0088","is_valid":true,"issue_name_ko":"가드레일 파손","issue_name_en":"Damaged guardrail","issue_type":"damaged_guardrail","inconvenience":55,"risk":65,"confidence":0.92,"evidence":["가드레일 약 2m 구간이 휘어지고 볼트가 이탈되어 있습니다.","파손 부위의 날카로운 금속 모서리가 보행자 쪽으로 돌출되어 있습니다.","충격 흔적으로 보아 차량 충돌에 의한 파손으로 보입니다."]}

예시 4 - 관련 없는 사진 (고양이):
{"analysis_id":"SEOUL-2026-INVALID","is_valid":false,"issue_name_ko":"인프라 아님","issue_name_en":"Not infrastructure","issue_type":"none","inconvenience":0,"risk":0,"confidence":1.0,"evidence":["사진에 고양이가 찍혀 있습니다.","도시 인프라 결함을 찾을 수 없습니다."]}

## 출력 JSON 스키마
{
  "analysis_id": "string (예: 'SEOUL-2026-XXXX')",
  "is_valid": "boolean (사진이 인프라 결함인지 여부)",
  "issue_name_ko": "string (한국어 이슈명)",
  "issue_name_en": "string (영어 이슈명)",
  "issue_type": "pothole|crack|sinkhole|broken_sidewalk|damaged_guardrail|faulty_streetlight|water_leak|debris|broken_sign|accessibility_obstacle|other|none",
  "inconvenience": "integer 0-100",
  "risk": "integer 0-100",
  "confidence": "float 0-1",
  "evidence": ["2-4개의 짧은 한국어 문장, 사진에서 보이는 것만 서술"]
}`;

