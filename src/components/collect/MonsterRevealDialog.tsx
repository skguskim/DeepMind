"use client";

import { useAppStore } from "@/lib/store";
import { getRarityColor, getRarityLabel, MAX_STATS } from "@/lib/scoring";
import { Skeleton } from "@/components/ui/skeleton";

export default function MonsterRevealDialog() {
  const {
    captureStep,
    creativeResult,
    monsterImageUrl,
    audioCryUrl,
    computedStats,
    collectedMonster,
    resetSession,
    setActiveTab,
  } = useAppStore();

  if (captureStep === "collecting") {
    return <CollectingSkeleton />;
  }

  if (captureStep !== "collected" || !creativeResult || !computedStats) return null;

  const playCry = () => {
    if (audioCryUrl) {
      const audio = new Audio(audioCryUrl);
      audio.play().catch(() => {});
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-28">
      <div className="mt-4">
        {/* Monster Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Monster Image */}
          <div className="p-4">
            <div className="relative w-full aspect-square rounded-lg flex items-center justify-center bg-gradient-to-br from-card-beige to-card-beige/60 overflow-hidden">
              {monsterImageUrl ? (
                <img
                  src={monsterImageUrl}
                  alt={creativeResult.monster_name_ko}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-white/40 text-9xl">
                  capture
                </span>
              )}
              {/* Rarity badge */}
              <div
                className="absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg"
                style={{
                  backgroundColor: getRarityColor(computedStats.rarity),
                }}
              >
                {computedStats.rarity}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 pb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {creativeResult.monster_name_ko}
                </h1>
                <p className="text-sm font-medium text-main">
                  Lv.{computedStats.level} {creativeResult.monster_title_ko}
                </p>
              </div>
              <button
                onClick={playCry}
                className="flex items-center gap-2 bg-main/10 text-main px-4 py-2 rounded-full hover:bg-main/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  volume_up
                </span>
                <span className="text-sm font-bold uppercase tracking-wider">
                  Cry
                </span>
              </button>
            </div>

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              {creativeResult.description_ko}
            </p>

            {/* Traits */}
            <div className="flex flex-wrap gap-2 mb-6">
              {creativeResult.traits_ko.map((trait, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  {trait}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Monster Stats
              </h3>
              {(
                [
                  { label: "HP", value: computedStats.hp, max: MAX_STATS.hp, color: "bg-monster-gray" },
                  { label: "ATK", value: computedStats.atk, max: MAX_STATS.atk, color: "bg-monster-gray" },
                  { label: "DEF", value: computedStats.def, max: MAX_STATS.def, color: "bg-monster-gray" },
                  { label: "SPD", value: computedStats.spd, max: MAX_STATS.spd, color: "bg-monster-gray" },
                  { label: "IMPACT", value: computedStats.impact_score, max: 100, color: "bg-main" },
                ] as const
              ).map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full transition-all duration-1000 ${
                        stat.label === "IMPACT"
                          ? "shadow-[0_0_8px_rgba(255,153,25,0.5)]"
                          : ""
                      }`}
                      style={{
                        width: `${Math.min(100, (stat.value / stat.max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Weakness hint */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 mb-4">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  lightbulb
                </span>
                약점 힌트: {creativeResult.weakness_hint_ko}
              </p>
            </div>

            {/* Cry text */}
            <p className="text-center text-sm text-slate-400 italic mb-4">
              &quot;{creativeResult.cry_text_hint}&quot;
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              setActiveTab("dex");
              resetSession();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-main py-4 text-lg font-bold text-white shadow-lg shadow-main/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">auto_stories</span>
            도감에서 보기
          </button>
          <button
            onClick={resetSession}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-200 dark:bg-slate-700 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:opacity-80 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              explore
            </span>
            새로운 탐색
          </button>
        </div>
      </div>
    </main>
  );
}

function CollectingSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto px-6 pb-28">
      <div className="mt-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
          <div className="relative w-full aspect-square rounded-lg mb-6 bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-main/30 overflow-hidden flex items-center justify-center">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,153,25,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,153,25,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            {/* Center icon */}
            <span className="material-symbols-outlined text-4xl text-main/30 animate-pulse relative z-10">
              radar
            </span>

            {/* Scanning line */}
            <div className="absolute left-0 w-full h-[3px] bg-main shadow-[0_0_15px_rgba(255,153,25,1)] animate-full-scanner z-20"></div>
            
            {/* Soft scan fade overlay */}
            <div className="absolute left-0 w-full h-32 bg-gradient-to-t from-main/20 to-transparent -translate-y-full animate-full-scanner z-10"></div>
          </div>
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-2.5 w-full rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="relative flex items-center justify-center size-16 bg-main/10 rounded-full animate-pulse">
            <span className="material-symbols-outlined text-main text-4xl animate-bounce">
              smart_toy
            </span>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">야생의 고장몬을 포획 중입니다...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">데이터 확보 및 도감에 기록 중</p>
          </div>
        </div>
      </div>
    </main>
  );
}
