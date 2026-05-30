import { PET_RULES } from "../../config/petRules";
import type { FeedResult, FoodItem, PetStats } from "../../types/domain";
import { clampAffection } from "../affection/affection";
import { applyEnergyDelta } from "../energy/energy";

export interface FoodValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSlotId(slotId: number): boolean {
  return Number.isInteger(slotId) && slotId >= 1 && slotId <= PET_RULES.FOOD_SLOT_LIMIT;
}

export function getFoodLevelBySlot(slotId: number): 0 | 1 | 2 | 3 {
  if (slotId === 1) return 0;
  if (slotId >= 2 && slotId <= 4) return 1;
  if (slotId >= 5 && slotId <= 8) return 2;
  return 3;
}

export function getFoodEffect(foodLevel: 0 | 1 | 2 | 3): { energyDelta: number; affectionDelta: number } {
  return PET_RULES.FOOD_LEVEL_EFFECTS[foodLevel];
}

export function validateFoodReplacement(name: string, iconDataUrl: string): FoodValidationResult {
  const errors: string[] = [];
  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 20) {
    errors.push("食物名称长度必须在 1-20 个字符之间。");
  }

  if (!iconDataUrl.startsWith("data:image/png;") && !iconDataUrl.startsWith("data:image/svg+xml;")) {
    errors.push("替换图标必须是 PNG 或 SVG 格式。");
  }

  return { valid: errors.length === 0, errors };
}

export function applyFeed(params: {
  food: FoodItem;
  stats: PetStats;
}): FeedResult {
  if (!params.food.enabled || params.food.count <= 0 || !validateSlotId(params.food.slotId)) {
    return {
      food: params.food,
      stats: params.stats,
      triggeredStateKey: "feed_blocked",
      message: "这个食物现在没有库存，先通过聊天或有效互动获得掉落吧。",
    };
  }

  const level = params.food.foodLevel ?? getFoodLevelBySlot(params.food.slotId);
  const effect = getFoodEffect(level);
  const stats: PetStats = {
    ...params.stats,
    energy: applyEnergyDelta(params.stats.energy, effect.energyDelta),
    affection: clampAffection(params.stats.affection + effect.affectionDelta),
    updatedAt: new Date().toISOString(),
  };
  const food: FoodItem = {
    ...params.food,
    count: Math.max(0, params.food.count - 1),
    updatedAt: new Date().toISOString(),
  };

  return {
    food,
    stats,
    triggeredStateKey: "feed_neutral",
    message: level === 0 ? "Rick 勉强吃下去了，能量恢复了，但好感降低了一点。" : "Rick 收下了这份补给。",
  };
}
