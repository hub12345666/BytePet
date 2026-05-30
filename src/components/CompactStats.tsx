import { Activity } from "lucide-react";
import type { PetStats } from "../types/domain";

interface CompactStatsProps {
  stats: PetStats | null;
  active: boolean;
  onClick: () => void;
}

export function CompactStats({ stats, active, onClick }: CompactStatsProps) {
  const energy = Math.round(stats?.energy ?? 100);
  const affection = Math.round(stats?.affection ?? 40);

  return (
    <button
      type="button"
      className={`action-btn flex w-full items-center gap-2 rounded-[6px] border px-2 py-1.5 text-left transition ${
        active
          ? "border-cyan-300 bg-cyan-100/80 text-sky-800"
          : "border-white/80 bg-white/60 text-slate-600 hover:border-sky-200 hover:bg-sky-50"
      }`}
      onClick={onClick}
      title="查看状态"
      aria-label="查看状态"
    >
      <Activity size={13} />
      <div className="flex flex-1 items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200/80">
          <div className="stat-bar-fill h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${energy}%` }} />
        </div>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200/80">
          <div className="stat-bar-fill h-full rounded-full bg-gradient-to-r from-pink-300 to-rose-500" style={{ width: `${affection}%` }} />
        </div>
      </div>
      <span className="text-[9px] font-semibold">{energy}</span>
    </button>
  );
}
