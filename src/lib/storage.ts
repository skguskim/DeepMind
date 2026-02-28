import localforage from "localforage";
import type { MonsterRecord } from "./schemas";

// Configure localforage
const monstersStore = localforage.createInstance({
  name: "civicquest",
  storeName: "monsters",
});

const blobsStore = localforage.createInstance({
  name: "civicquest",
  storeName: "blobs",
});

// ── Monster Record CRUD ────────────────────────────────────────────

export async function saveMonster(record: MonsterRecord): Promise<void> {
  await monstersStore.setItem(record.id, record);
}

export async function getMonster(id: string): Promise<MonsterRecord | null> {
  return monstersStore.getItem<MonsterRecord>(id);
}

export async function getAllMonsters(): Promise<MonsterRecord[]> {
  const records: MonsterRecord[] = [];
  await monstersStore.iterate<MonsterRecord, void>((value) => {
    records.push(value);
  });
  // Sort by newest first
  records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return records;
}

export async function deleteMonster(id: string): Promise<void> {
  const record = await getMonster(id);
  if (record) {
    await blobsStore.removeItem(record.originalPhotoKey);
    await blobsStore.removeItem(record.monsterImageKey);
    await blobsStore.removeItem(record.audioCryKey);
    await monstersStore.removeItem(id);
  }
}

export async function resetCollection(): Promise<void> {
  await monstersStore.clear();
  await blobsStore.clear();
}

// ── Blob Storage ───────────────────────────────────────────────────

export async function saveBlob(key: string, blob: Blob): Promise<void> {
  await blobsStore.setItem(key, blob);
}

export async function getBlob(key: string): Promise<Blob | null> {
  return blobsStore.getItem<Blob>(key);
}

// ── Settings (localStorage) ────────────────────────────────────────

export interface AppSettings {
  apiKey: string;
  analysisModel: string;
  imageModel: string;
  ttsModel: string;
  ttsVoice: string;
}

const SETTINGS_KEY = "civicquest_settings";

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  analysisModel: "gemini-2.5-flash",
  imageModel: "gemini-2.5-flash-image",
  ttsModel: "gemini-2.5-flash-preview-tts",
  ttsVoice: "Kore",
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}
