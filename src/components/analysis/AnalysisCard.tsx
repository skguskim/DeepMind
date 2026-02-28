"use client";

import { useAppStore } from "@/lib/store";
import { getRarityColor, getRarityLabel } from "@/lib/scoring";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function AnalysisCard() {
  const {
    captureStep,
    capturedImageUrl,
    analysisResult,
    computedStats,
    integrityToken,
    setCaptureStep,
    setCreativeResult,
    setMonsterImageUrl,
    setAudioCryUrl,
    setCollectedMonster,
    resetSession,
  } = useAppStore();

  if (captureStep === "analyzing") {
    return <AnalysisSkeleton />;
  }

  if (captureStep !== "analyzed" || !analysisResult || !computedStats) return null;

  const handleCollect = async () => {
    setCaptureStep("collecting");

    try {
      const { buildCreativePrompt, buildImagePrompt } = await import(
        "@/lib/gemini/prompts"
      );
      const { callCreative, callGeminiImage, callGeminiTTS } = await import(
        "@/lib/gemini/client"
      );
      const { sha256Base64, buildIntegrityInput } = await import(
        "@/lib/crypto"
      );

      // 1. Creative JSON
      const promptText = buildCreativePrompt(
        analysisResult,
        computedStats,
        integrityToken!
      );
      const creative = await callCreative(promptText);

      // Validate echo
      const recomputedInput = buildIntegrityInput(
        analysisResult.analysis_id,
        analysisResult.inconvenience,
        analysisResult.risk,
        computedStats.impact_score,
        computedStats.rarity,
        computedStats.level,
        computedStats.hp,
        computedStats.atk,
        computedStats.def,
        computedStats.spd
      );
      const recomputedToken = await sha256Base64(recomputedInput);

      if (creative.stats_echo.integrity_token !== recomputedToken) {
        console.warn("Integrity token mismatch, but proceeding (demo mode).");
      }

      setCreativeResult(creative);

      // 2. Monster Image — pass original photo as reference
      const { resizeAndBase64 } = await import("@/lib/gemini/client");
      const { capturedImage: origImg } = useAppStore.getState();
      let photoBase64: string | undefined;
      let photoMime: string | undefined;
      if (origImg) {
        const resized = await resizeAndBase64(origImg, 720);
        photoBase64 = resized.base64;
        photoMime = resized.mimeType;
      }
      const imagePrompt = buildImagePrompt(creative.image_prompt_ko);

      // 2 & 3. Run Monster Image and TTS concurrently to speed up the process
      const [imageBlob, audioBlob] = await Promise.all([
        callGeminiImage(imagePrompt, photoBase64, photoMime),
        callGeminiTTS(creative.cry_ssml).catch((ttsErr) => {
          console.warn("TTS failed, skipping cry:", ttsErr);
          return new Blob([], { type: "audio/wav" });
        })
      ]);

      const imageUrl = URL.createObjectURL(imageBlob);
      setMonsterImageUrl(imageUrl);

      const audioUrl = audioBlob.size > 0 ? URL.createObjectURL(audioBlob) : "";
      if (audioUrl) {
        setAudioCryUrl(audioUrl);
      }

      // 4. Save to storage
      const { saveBlob, saveMonster } = await import("@/lib/storage");
      const monsterId = uuidv4();
      const photoKey = `photo_${monsterId}`;
      const imgKey = `img_${monsterId}`;
      const audioKey = `audio_${monsterId}`;

      // Save blobs
      const { capturedImage } = useAppStore.getState();
      if (capturedImage) {
        // Convert File to a pure Blob to avoid IndexedDB structural cloning errors (DataCloneError)
        const buffer = await capturedImage.arrayBuffer();
        const pureBlob = new Blob([buffer], { type: capturedImage.type });
        await saveBlob(photoKey, pureBlob);
      }
      await saveBlob(imgKey, imageBlob);
      if (audioBlob.size > 0) {
        await saveBlob(audioKey, audioBlob);
      }

      const { location } = useAppStore.getState();
      const monsterRecord = {
        id: monsterId,
        createdAt: new Date().toISOString(),
        location: location || { lat: 37.5665, lng: 126.978 },
        analysis: analysisResult,
        stats: computedStats,
        creative: {
          monster_name_ko: creative.monster_name_ko,
          monster_title_ko: creative.monster_title_ko,
          description_ko: creative.description_ko,
          traits_ko: creative.traits_ko,
          weakness_hint_ko: creative.weakness_hint_ko,
          cry_text_hint: creative.cry_text_hint,
        },
        integrity_token: integrityToken || "",
        originalPhotoKey: photoKey,
        monsterImageKey: imgKey,
        audioCryKey: audioKey,
      };

      await saveMonster(monsterRecord);
      setCollectedMonster(monsterRecord);

      // Background Task: Generate Repaired Photo ("1 month later")
      (async () => {
        try {
          const repairedPrompt = `이 사진은 파손되거나 비정상적인 상태의 도시 인프라를 보여줍니다. 이 사진과 똑같은 구도, 원근감, 배경, 색감(실사화 유지)을 그대로 유지한 채로, 파손된 부분이 **원래의 완벽하고 정상적인 상태**로 복구된 "1개월 후"의 모습을 생성하세요. 
주의사항:
- 단순히 구멍만 메우는 것이 아니라, 기울어지거나 쓰러진 기둥(예: 볼라드, 가로등, 신호등)은 원래의 수직 각도로 똑바로 서 있는 평범한 상태로 완전히 복구해야 합니다.
- 부서지거나 찢어진 부분은 새것처럼 매끄럽게 교체된 상태여야 합니다.
- 다른 주변 배경이나 요소는 절대 변경하지 말고 오직 수리된 모습만 실사풍으로 만들어야 합니다.
- 몬스터나 글자를 추가하지 마세요.`;
          
          let ratio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
          if (photoBase64 && photoMime) {
            const img = new Image();
            img.src = `data:${photoMime};base64,${photoBase64}`;
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
            if (img.width && img.height) {
              const r = img.width / img.height;
              const ratios = [
                { name: "1:1", val: 1 },
                { name: "3:4", val: 3 / 4 },
                { name: "4:3", val: 4 / 3 },
                { name: "9:16", val: 9 / 16 },
                { name: "16:9", val: 16 / 9 },
              ];
              let closest = ratios[0];
              let minDiff = Math.abs(r - closest.val);
              for (const rt of ratios) {
                const diff = Math.abs(r - rt.val);
                if (diff < minDiff) {
                  closest = rt;
                  minDiff = diff;
                }
              }
              ratio = closest.name as any;
            }
          }

          const repairedBlob = await callGeminiImage(repairedPrompt, photoBase64, photoMime, ratio);
          const repKey = `repaired_${monsterId}`;
          await saveBlob(repKey, repairedBlob);
          const updatedRecord = { ...monsterRecord, repairedPhotoKey: repKey };
          await saveMonster(updatedRecord);
          // if it's the currently displaying monster, update state
          if (useAppStore.getState().collectedMonster?.id === monsterId) {
            useAppStore.setState({ collectedMonster: updatedRecord });
          }
        } catch (e) {
          console.error("Failed to generate repaired background image", e);
        }
      })();

      // Play cry
      if (audioUrl) {
        try {
          const audio = new Audio(audioUrl);
          audio.play().catch(() => {});
        } catch {}
      }

      setCaptureStep("collected");
      toast.success(`${creative.monster_name_ko} 수집 완료! 🎉`);
    } catch (err) {
      toast.error(
        `수집 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
      setCaptureStep("analyzed");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-28">
      <section className="mt-2 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
          {/* Decorative blurs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-main/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent-teal/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Photo preview */}
            {capturedImageUrl && (
              <div className="mb-6 w-full h-56 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700">
                <img
                  src={capturedImageUrl}
                  alt="Analyzed infrastructure"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <div className="mb-8 text-left">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                {analysisResult.issue_name_ko}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ID: #{analysisResult.analysis_id}
              </p>
            </div>

            {/* Score bars */}
            <div className="space-y-5 mb-8">
              {/* Inconvenience */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-main text-sm">
                      warning
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      불편도 (Inconvenience)
                    </span>
                  </div>
                  <span className="text-base font-black text-main">
                    {analysisResult.inconvenience}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-main shadow-[0_0_10px_rgba(255,153,25,0.5)] transition-all duration-1000"
                    style={{ width: `${analysisResult.inconvenience}%` }}
                  />
                </div>
              </div>

              {/* Risk */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-teal text-sm">
                      public
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      위험도 (Risk)
                    </span>
                  </div>
                  <span className="text-base font-black text-accent-teal">
                    {analysisResult.risk}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-teal shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-all duration-1000"
                    style={{ width: `${analysisResult.risk}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{
                  backgroundColor: getRarityColor(computedStats.rarity),
                }}
              >
                {getRarityLabel(computedStats.rarity)}
              </span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Lv.{computedStats.level}
              </span>
              <span className="text-sm text-slate-500">
                Impact: {computedStats.impact_score}
              </span>
            </div>

            {/* Evidence */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                현장 분석 보고서
              </h3>
              <ul className="space-y-4">
                {analysisResult.evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 min-w-[20px]">
                      <span className="material-symbols-outlined text-main text-sm">
                        check_circle
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Collect Button or Invalid Message */}
        <div className="pt-2">
          {analysisResult.is_valid ? (
            <button
              onClick={handleCollect}
              className="glow-button relative group w-full overflow-hidden rounded-2xl bg-main py-4 text-white transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex flex-col items-center justify-center gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl animate-bounce">
                    smart_toy
                  </span>
                  <span className="text-lg font-black uppercase tracking-widest">
                    고장몬 포획하기
                  </span>
                </div>
                <span className="text-[10px] font-bold opacity-90 bg-white/25 px-2.5 py-0.5 rounded-full mt-0.5">
                  Reward: {computedStats.impact_score * 5} XP +{" "}
                  {getRarityLabel(computedStats.rarity)} Badge
                </span>
              </div>
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 text-center">
              <span className="material-symbols-outlined text-slate-400 text-3xl mb-2">
                error
              </span>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                인프라 결함이 감지되지 않았습니다.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                도시의 고장난 시설물이나 위험 요소를 다시 촬영해주세요.
              </p>
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={resetSession}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 py-2"
        >
          ← 다른 흔적 찾기
        </button>
      </section>
    </main>
  );
}

function AnalysisSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto px-6 pb-28">
      <div className="mt-2 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <Skeleton className="w-full h-56 rounded-3xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-5 mb-8">
            <div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="relative flex items-center justify-center size-16 bg-main/10 rounded-full animate-pulse">
            <span className="material-symbols-outlined text-main text-4xl animate-spin" style={{ animationDuration: '3s' }}>
              radar
            </span>
          </div>
          <p className="text-sm font-bold text-slate-500">고장몬의 흔적을 분석 중입니다...</p>
        </div>
      </div>
    </main>
  );
}
