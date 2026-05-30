import { Battery, Calendar, Heart, MessageCircle, MousePointer2 } from "lucide-react";
import type { PetStats } from "../types/domain";
import { PanelShell } from "./PanelShell";
import { StatBar } from "./StatBar";

interface StatsPanelProps {
  stats: PetStats | null;
  characterName?: string | null;
  onClose: () => void;
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatsPanel({ stats, characterName, onClose }: StatsPanelProps) {
  const energy = stats?.energy ?? 60;
  const affection = stats?.affection ?? 40;
  const todayChatRounds = stats?.todayChatRounds ?? 0;
  const todayInteractionCount = stats?.todayInteractionCount ?? 0;

  return (
    <PanelShell title="状态" subtitle={`${characterName?.trim() || "当前人物"} 的实时数据`} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2.5 pb-2">
            <div className="space-y-2">
              <StatBar label="能量" value={energy} tone="cyan" />
              <StatBar label="好感" value={affection} tone="pink" />
            </div>

            <div className="space-y-2 rounded-[8px] border border-sky-100 bg-white/60 p-3 text-[12px]">
              <div className="flex items-center gap-2 text-slate-600">
                <MessageCircle size={14} className="shrink-0 text-sky-500" />
                <span>今日聊天轮数</span>
                <span className="ml-auto font-semibold text-slate-700">{todayChatRounds} 轮</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MousePointer2 size={14} className="shrink-0 text-cyan-500" />
                <span>今日有效互动</span>
                <span className="ml-auto font-semibold text-slate-700">{todayInteractionCount} 次</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} className="shrink-0 text-violet-500" />
                <span>最后聊天时间</span>
                <span className="ml-auto font-semibold text-slate-700">{formatTime(stats?.lastChatAt)}</span>
              </div>
            </div>

            <div className="rounded-[8px] border border-dashed border-cyan-200 bg-cyan-50/60 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
              <div className="mb-1 flex items-center gap-1.5">
                <Battery size={12} className="shrink-0 text-sky-500" />
                <span className="font-semibold text-slate-600">结算说明</span>
              </div>
              <p>
                每天早上 6 点先按昨日是否聊天/互动结算好感，再按昨日结束能量结算好感，最后把能量重置为 60。
              </p>
              <div className="mt-1 flex items-center gap-1 text-pink-500">
                <Heart size={11} className="shrink-0" />
                <span>好感和能量都会限制在 0 到 100。</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
