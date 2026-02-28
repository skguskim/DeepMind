"use client";

import { useRef, useCallback, useState } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function CapturePanel() {
  const {
    capturedImage,
    capturedImageUrl,
    setCapturedImage,
    setCapturedImageUrl,
    setLocation,
    captureStep,
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다.");
        return;
      }
      setCapturedImage(file);
      const url = URL.createObjectURL(file);
      setCapturedImageUrl(url);

      // Try geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            toast.success("위치 정보가 기록되었습니다.");
          },
          () => {
            setLocation({ lat: 37.5665, lng: 126.978, address: "서울특별시" });
            toast.info("위치 접근이 거부되어 기본 위치(서울)로 설정됩니다.");
          }
        );
      } else {
        setLocation({ lat: 37.5665, lng: 126.978, address: "서울특별시" });
      }
    },
    [setCapturedImage, setCapturedImageUrl, setLocation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (captureStep !== "idle") return null;

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-28">
      {/* Camera / Upload Area */}
      <div
        className={`relative mt-2 aspect-[4/5] w-full overflow-hidden rounded-xl border-4 border-dashed transition-colors ${
          isDragging
            ? "border-main bg-main/10"
            : "border-main/40 bg-slate-900/10 dark:bg-slate-900/40"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer">
          {capturedImageUrl ? (
            <img
              src={capturedImageUrl}
              alt="Captured"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              {/* Scanner line animation */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-main to-transparent animate-scanner shadow-[0_0_15px_rgba(255,153,25,0.8)]" />
              <div className="z-10 flex flex-col items-center text-center px-8">
                <span className="material-symbols-outlined text-main text-5xl mb-2">
                  center_focus_weak
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  고장몬 탐색
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  고장난 현장을 촬영하여 고장몬의 흔적을 쫓으세요
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gallery + Camera buttons when no image */}
      {!capturedImage && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-main py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            카메라 촬영
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-700 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">photo_library</span>
            갤러리에서 선택
          </button>
        </div>
      )}

      {/* Analyze Button */}
      {capturedImage && <AnalyzeButton />}

      {/* Tips */}
      {!capturedImage && (
        <div className="mt-8 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <span className="material-symbols-outlined text-lg">
                lightbulb
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              고장몬 발견 팁{" "}
              <span className="text-sm font-normal text-slate-500 ml-1">
                (잘 찍는 법)
              </span>
            </h3>
          </div>
          <ul className="space-y-3">
            {[
              "문제가 되는 부분이 사진 중앙에 오도록 해주세요.",
              "주변 환경이 조금 보이도록 멀리서도 한 장 찍어주세요.",
              "흔들리지 않게 주의해주세요.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tip}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function AnalyzeButton() {
  const {
    capturedImage,
    setCaptureStep,
    setAnalysisResult,
    setComputedStats,
    setIntegrityToken,
    resetSession,
  } = useAppStore();

  const handleAnalyze = async () => {
    if (!capturedImage) return;

    const { getSettings } = await import("@/lib/storage");
    const settings = getSettings();
    if (!settings.apiKey) {
      toast.error("Settings에서 Gemini API 키를 먼저 입력해주세요.");
      useAppStore.getState().setSettingsOpen(true);
      return;
    }

    setCaptureStep("analyzing");

    try {
      const { resizeAndBase64, callAnalysis } = await import(
        "@/lib/gemini/client"
      );
      const { base64, mimeType } = await resizeAndBase64(capturedImage, 720);
      const analysis = await callAnalysis(base64, mimeType);
      setAnalysisResult(analysis);

      // Compute stats
      const { computeStats } = await import("@/lib/scoring");
      const stats = computeStats(analysis.inconvenience, analysis.risk);
      setComputedStats(stats);

      // Compute integrity token
      const { sha256Base64, buildIntegrityInput } = await import(
        "@/lib/crypto"
      );
      const input = buildIntegrityInput(
        analysis.analysis_id,
        analysis.inconvenience,
        analysis.risk,
        stats.impact_score,
        stats.rarity,
        stats.level,
        stats.hp,
        stats.atk,
        stats.def,
        stats.spd
      );
      const token = await sha256Base64(input);
      setIntegrityToken(token);

      setCaptureStep("analyzed");
      toast.success("분석이 완료되었습니다!");
    } catch (err) {
      toast.error(
        `분석 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
      setCaptureStep("idle");
    }
  };

  return (
    <div className="mt-6 space-y-3">
      <button
        onClick={handleAnalyze}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-main py-4 text-lg font-bold text-white shadow-lg shadow-main/20 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined">radar</span>
        고장몬 흔적 조사하기
      </button>
      <button
        onClick={resetSession}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-200 dark:bg-slate-700 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:opacity-80 transition-all"
      >
        다른 흔적 찾기
      </button>
    </div>
  );
}
