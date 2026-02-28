"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { MonsterRecord } from "@/lib/schemas";
import { getAllMonsters, getBlob } from "@/lib/storage";
import { getRarityColor, getRarityLabel, MAX_STATS } from "@/lib/scoring";

export default function DexGrid() {
  const { setSelectedMonsterId, selectedMonsterId } = useAppStore();
  const [monsters, setMonsters] = useState<MonsterRecord[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    loadMonsters();
  }, []);

  const loadMonsters = async () => {
    const all = await getAllMonsters();
    setMonsters(all);
    // Load images
    const urls: Record<string, string> = {};
    for (const m of all) {
      const blob = await getBlob(m.monsterImageKey);
      if (blob) urls[m.id] = URL.createObjectURL(blob);
    }
    setImageUrls(urls);
  };

  const filteredMonsters = useMemo(() => {
    let result = [...monsters];
    if (filter !== "all") {
      result = result.filter((m) => m.analysis.issue_type === filter);
    }
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "impact":
        result.sort((a, b) => b.stats.impact_score - a.stats.impact_score);
        break;
      case "rarity":
        const rarityOrder = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };
        result.sort((a, b) => rarityOrder[b.stats.rarity] - rarityOrder[a.stats.rarity]);
        break;
      case "level":
        result.sort((a, b) => b.stats.level - a.stats.level);
        break;
    }
    return result;
  }, [monsters, filter, sortBy]);

  const issueTypes = useMemo(() => {
    const types = new Set(monsters.map((m) => m.analysis.issue_type));
    return Array.from(types);
  }, [monsters]);

  if (selectedMonsterId) {
    const monster = monsters.find((m) => m.id === selectedMonsterId);
    if (monster) {
      return (
        <MonsterDetailView
          monster={monster}
          imageUrl={imageUrls[monster.id]}
          onBack={() => setSelectedMonsterId(null)}
        />
      );
    }
  }

  return (
    <main className="flex-1 overflow-y-auto pb-28 no-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-white dark:bg-bg-dark sticky top-0 z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Monster Dex
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Seoul Infrastructure Collection
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-2">
        <div className="bg-main/10 dark:bg-main/20 rounded-xl p-4 flex items-center justify-between border border-main/20">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-main rounded-full flex items-center justify-center text-white">
              <span className="material-symbols-outlined font-bold">
                trophy
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-main">
                Progress
              </p>
              <p className="text-lg font-bold">
                {monsters.length}{" "}
                <span className="text-sm font-medium text-slate-500">
                  Collected
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 py-4">
        <div className="flex gap-2 px-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-bold transition-all ${
              filter === "all"
                ? "bg-main text-white shadow-lg shadow-main/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            All
          </button>
          {issueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 text-sm font-medium transition-all ${
                filter === type
                  ? "bg-main text-white shadow-lg shadow-main/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="px-6 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sort by:{" "}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-main bg-transparent border-none font-bold cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="impact">Impact</option>
              <option value="rarity">Rarity</option>
              <option value="level">Level</option>
            </select>
          </p>
          <span className="material-symbols-outlined text-slate-400 text-sm">
            filter_list
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6">
        {filteredMonsters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
              inventory_2
            </span>
            <p className="text-lg font-bold text-slate-400">아직 수집한 몬스터가 없습니다</p>
            <p className="text-sm text-slate-400 mt-1">
              Capture 탭에서 야생의 고장몬을 탐색해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMonsters.map((monster) => (
              <button
                key={monster.id}
                onClick={() => setSelectedMonsterId(monster.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 relative overflow-hidden group text-left hover:shadow-md transition-shadow"
              >
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{
                      color: getRarityColor(monster.stats.rarity),
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    stars
                  </span>
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-main/5 to-main/20 flex items-center justify-center overflow-hidden">
                  {imageUrls[monster.id] ? (
                    <img
                      src={imageUrls[monster.id]}
                      alt={monster.creative.monster_name_ko}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">
                      pest_control
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Lv.{monster.stats.level} •{" "}
                    {monster.analysis.issue_type}
                  </p>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {monster.creative.monster_name_ko}
                  </h3>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: getRarityColor(monster.stats.rarity),
                    }}
                  >
                    {getRarityLabel(monster.stats.rarity)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Monster Detail View ────────────────────────────────────────────

function MonsterDetailView({
  monster,
  imageUrl,
  onBack,
}: {
  monster: MonsterRecord;
  imageUrl?: string;
  onBack: () => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [repairedPhotoUrl, setRepairedPhotoUrl] = useState<string | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const aBlob = await getBlob(monster.audioCryKey);
      if (aBlob && aBlob.size > 0) setAudioUrl(URL.createObjectURL(aBlob));
      const pBlob = await getBlob(monster.originalPhotoKey);
      if (pBlob) setPhotoUrl(URL.createObjectURL(pBlob));
      if (monster.repairedPhotoKey) {
        const rBlob = await getBlob(monster.repairedPhotoKey);
        if (rBlob) setRepairedPhotoUrl(URL.createObjectURL(rBlob));
      }
    })();
  }, [monster]);

  const playCry = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pb-28">
      {/* Top Nav */}
      <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-bg-light dark:bg-bg-dark">
        <button
          onClick={onBack}
          className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          {monster.creative.monster_name_ko}
        </h2>
        <div className="w-12" />
      </div>

      <div className="px-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Monster Image */}
          <div className="p-4">
            <div className="relative w-full aspect-square rounded-lg flex items-center justify-center bg-gradient-to-br from-card-beige to-card-beige/60 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={monster.creative.monster_name_ko}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-white/40 text-9xl">
                  capture
                </span>
              )}
              <div
                className="absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest shadow-lg"
                style={{
                  backgroundColor: getRarityColor(monster.stats.rarity),
                }}
              >
                {monster.stats.rarity}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Name + Cry */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {monster.creative.monster_name_ko}
                </h1>
                <p className="text-sm font-medium text-main">
                  Lv.{monster.stats.level} {monster.creative.monster_title_ko}
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

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              {monster.creative.description_ko}
            </p>

            {/* Traits */}
            <div className="flex flex-wrap gap-2 mb-6">
              {monster.creative.traits_ko.map((trait, i) => (
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
                  { label: "HP", value: monster.stats.hp, max: MAX_STATS.hp, color: "bg-monster-gray" },
                  { label: "ATK", value: monster.stats.atk, max: MAX_STATS.atk, color: "bg-monster-gray" },
                  { label: "DEF", value: monster.stats.def, max: MAX_STATS.def, color: "bg-monster-gray" },
                  { label: "SPD", value: monster.stats.spd, max: MAX_STATS.spd, color: "bg-monster-gray" },
                  { label: "IMPACT", value: monster.stats.impact_score, max: 100, color: "bg-main" },
                ] as const
              ).map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full ${
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

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  불편도
                </p>
                <p className="text-sm font-bold text-main">
                  {monster.analysis.inconvenience}%
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  위험도
                </p>
                <p className="text-sm font-bold text-accent-teal">
                  {monster.analysis.risk}%
                </p>
              </div>
            </div>

            {/* Evidence */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                분석 증거
              </h3>
              <ul className="space-y-2">
                {monster.analysis.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-main text-sm mt-0.5">
                      check_circle
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {e}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-4">
              <span className="material-symbols-outlined text-main">
                location_on
              </span>
              <div>
                <p className="text-xs text-slate-500">Discovered At</p>
                <p className="text-sm font-bold">
                  {monster.location.address ||
                    `${monster.location.lat.toFixed(4)}, ${monster.location.lng.toFixed(4)}`}
                </p>
              </div>
            </div>

            {/* Original photo */}
            {photoUrl && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                    원본 사진
                  </h3>
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => setExpandedImageUrl(photoUrl)}
                  >
                    <img
                      src={photoUrl}
                      alt="Original capture"
                      className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-md text-3xl">
                        zoom_in
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md rounded-md px-2 py-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-white text-xs">zoom_in</span>
                      <span className="text-white text-[10px] font-bold">확대</span>
                    </div>
                  </div>
                </div>

                {/* Repaired photo */}
                {repairedPhotoUrl && (
                  <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">build_circle</span>
                      1개월 후... (수리 완료)
                    </h3>
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => setExpandedImageUrl(repairedPhotoUrl)}
                    >
                      <img
                        src={repairedPhotoUrl}
                        alt="Repaired capture"
                        className="w-full h-48 object-cover rounded-xl border-2 border-main/20 shadow-md shadow-main/10"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-md text-3xl">
                          zoom_in
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md rounded-md px-2 py-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-white text-xs">zoom_in</span>
                        <span className="text-white text-[10px] font-bold">확대</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weakness */}
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  lightbulb
                </span>
                약점: {monster.creative.weakness_hint_ko}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Overlay */}
      {expandedImageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setExpandedImageUrl(null)}
        >
          <div className="w-full flex justify-end p-2 pb-4">
            <button 
              className="text-white bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors flex items-center justify-center backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImageUrl(null);
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <img 
            src={expandedImageUrl} 
            alt="Expanded view" 
            className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}
