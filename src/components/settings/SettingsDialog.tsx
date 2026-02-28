"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSettings, saveSettings, resetCollection, type AppSettings } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useAppStore();
  const [settings, setLocalSettings] = useState<AppSettings>({
    apiKey: "",
    analysisModel: "gemini-2.5-flash",
    imageModel: "gemini-2.5-flash-image",
    ttsModel: "gemini-2.5-flash-preview-tts",
    ttsVoice: "Kore",
  });

  useEffect(() => {
    if (settingsOpen) {
      setLocalSettings(getSettings());
    }
  }, [settingsOpen]);

  const handleSave = () => {
    saveSettings(settings);
    toast.success("설정이 저장되었습니다.");
    setSettingsOpen(false);
  };

  const handleReset = async () => {
    if (confirm("정말로 모든 수집 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      await resetCollection();
      toast.success("컬렉션이 초기화되었습니다.");
    }
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-[400px] mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-main">settings</span>
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Gemini API Key
            </label>
            <Input
              type="password"
              placeholder="AIza..."
              value={settings.apiKey}
              onChange={(e) =>
                setLocalSettings({ ...settings, apiKey: e.target.value })
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-400">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-main hover:underline"
              >
                Google AI Studio
              </a>
              에서 API 키를 발급받으세요.
            </p>
          </div>

          {/* Analysis Model */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Analysis Model
            </label>
            <Input
              value={settings.analysisModel}
              onChange={(e) =>
                setLocalSettings({ ...settings, analysisModel: e.target.value })
              }
              className="text-sm"
            />
          </div>

          {/* Image Model */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Image Model
            </label>
            <Input
              value={settings.imageModel}
              onChange={(e) =>
                setLocalSettings({ ...settings, imageModel: e.target.value })
              }
              className="text-sm"
            />
          </div>

          {/* TTS Model */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              TTS Model
            </label>
            <Input
              value={settings.ttsModel}
              onChange={(e) =>
                setLocalSettings({ ...settings, ttsModel: e.target.value })
              }
              className="text-sm"
            />
          </div>

          {/* TTS Voice */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              TTS Voice
            </label>
            <Input
              value={settings.ttsVoice}
              onChange={(e) =>
                setLocalSettings({ ...settings, ttsVoice: e.target.value })
              }
              placeholder="Kore"
              className="text-sm"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full rounded-full bg-main py-3 text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            저장하기
          </button>

          {/* Danger zone */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
              Danger Zone
            </p>
            <button
              onClick={handleReset}
              className="w-full rounded-full border-2 border-red-300 py-2.5 text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              컬렉션 초기화
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
