import { BatteryCharging, Edit3, PackagePlus, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import type { FeedResult, FoodItem, FoodReplaceRequest, PetStats } from "../types/domain";
import { PanelShell } from "./PanelShell";

interface FeedPanelProps {
  foods: FoodItem[];
  stats: PetStats | null;
  onFeed: (foodId: string) => Promise<FeedResult | null>;
  onReplaceFood: (request: FoodReplaceRequest) => Promise<void>;
  onClose: () => void;
}

const levelTone: Record<number, string> = {
  0: "border-slate-200 bg-slate-50 text-slate-600",
  1: "border-sky-100 bg-sky-50 text-sky-700",
  2: "border-cyan-100 bg-cyan-50 text-cyan-700",
  3: "border-amber-100 bg-amber-50 text-amber-700",
};

function FoodGlyph({ food }: { food: FoodItem }) {
  if (food.iconPath) {
    return <img className="h-6 w-6 object-contain" src={food.iconPath} alt="" draggable={false} />;
  }
  const Icon = food.foodLevel === 3 ? BatteryCharging : food.foodLevel === 0 ? PackagePlus : Utensils;
  return <Icon size={20} />;
}

function effectText(food: FoodItem): string {
  const parts = [`能量 ${food.energyDelta >= 0 ? "+" : ""}${food.energyDelta}`];
  if (food.affectionDelta !== 0) {
    parts.push(`好感 ${food.affectionDelta >= 0 ? "+" : ""}${food.affectionDelta}`);
  }
  return parts.join(" / ");
}

export function FeedPanel({ foods, stats, onFeed, onReplaceFood, onClose }: FeedPanelProps) {
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [name, setName] = useState("");
  const [iconDataUrl, setIconDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orderedFoods = useMemo(
    () => [...foods].sort((a, b) => a.displayOrder - b.displayOrder || a.slotId - b.slotId),
    [foods]
  );

  function beginEdit(food: FoodItem): void {
    setEditing(food);
    setName(food.name);
    setIconDataUrl("");
    setError(null);
  }

  async function readIcon(file: File | undefined): Promise<void> {
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/svg+xml") {
      setError("只能上传 PNG 或 SVG 图标。");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setIconDataUrl(dataUrl);
    setError(null);
  }

  async function saveEdit(): Promise<void> {
    if (!editing) return;
    if (!name.trim()) {
      setError("请填写食物名称。");
      return;
    }
    if (!iconDataUrl) {
      setError("替换食物需要上传 PNG 或 SVG 图标。");
      return;
    }
    await onReplaceFood({ foodId: editing.id, name: name.trim(), iconDataUrl });
    setEditing(null);
  }

  return (
    <PanelShell title="喂食" subtitle={`能量 ${Math.round(stats?.energy ?? 60)} / 保质期：本周内有效`} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2 pb-2">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">
              {orderedFoods.map((food) => (
                <div
                  key={food.id}
                  className="group flex min-h-[126px] min-w-0 flex-col justify-between rounded-[8px] border border-sky-100 bg-white/78 p-2 text-left transition hover:border-cyan-300 hover:bg-sky-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border ${levelTone[food.foodLevel]}`}>
                      <FoodGlyph food={food} />
                    </div>
                    <div className="flex min-w-0 items-center">
                      <span className="shrink-0 rounded-full bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-700">x{food.count}</span>
                    </div>
                  </div>

                  <div className="mt-1 min-w-0" title={food.name}>
                    <p className="truncate text-[11px] font-semibold text-slate-700">{food.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{food.foodLevel}级 · {effectText(food)}</p>
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <button
                      className="flex h-7 min-w-0 items-center justify-center rounded-[7px] bg-blue-500 px-1 text-[10px] font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      type="button"
                      disabled={food.count <= 0}
                      onClick={() => void onFeed(food.id)}
                    >
                      喂食
                    </button>
                    <button
                      className="flex h-7 min-w-0 items-center justify-center gap-1 rounded-[7px] border border-sky-100 bg-white/80 px-1 text-[10px] font-semibold text-sky-700 transition hover:bg-sky-50"
                      type="button"
                      onClick={() => beginEdit(food)}
                    >
                      <Edit3 size={11} />
                      替换
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editing ? (
              <div className="rounded-[8px] border border-sky-100 bg-white/86 p-3 text-[11px] shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">替换 {editing.foodLevel}级槽位</span>
                  <span className="text-[10px] text-slate-400">等级固定不可修改</span>
                </div>
                <input
                  className="mb-2 h-8 w-full rounded-[8px] border border-sky-100 bg-white px-2 text-[12px] outline-none focus:border-cyan-300"
                  value={name}
                  maxLength={20}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="食物名称"
                />
                <input
                  className="mb-2 block w-full text-[11px] text-slate-500 file:mr-2 file:h-7 file:rounded-[7px] file:border file:border-sky-100 file:bg-sky-50 file:px-2 file:text-sky-700"
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(event) => void readIcon(event.target.files?.[0])}
                />
                {error ? <p className="mb-2 text-[10px] font-semibold text-rose-500">{error}</p> : null}
                <div className="flex gap-2">
                  <button className="h-8 flex-1 rounded-[8px] bg-blue-500 text-[12px] font-semibold text-white" type="button" onClick={() => void saveEdit()}>
                    保存替换
                  </button>
                  <button className="h-8 flex-1 rounded-[8px] border border-sky-100 bg-white text-[12px] font-semibold text-slate-600" type="button" onClick={() => setEditing(null)}>
                    取消
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-[8px] border border-dashed border-cyan-200 bg-cyan-50/60 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
              <div className="mb-1 flex items-center gap-1.5">
                <PackagePlus size={12} className="shrink-0 text-sky-500" />
                <span className="font-semibold text-slate-600">库存说明</span>
              </div>
              <p>
                当前食物库存仅属于该角色。所有食物都有保质期，只能在当前自然周内使用。
              </p>
              <p className="mt-1">
                每周一早上 6 点，系统会先完成每日结算，再清空全部食物库存。
              </p>
            </div>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
