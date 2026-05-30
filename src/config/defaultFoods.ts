import type { FoodItem } from "../types/domain";

const now = new Date(0).toISOString();

const levelEffect = {
  0: { energyDelta: 5, affectionDelta: -2 },
  1: { energyDelta: 2, affectionDelta: 0 },
  2: { energyDelta: 5, affectionDelta: 0 },
  3: { energyDelta: 10, affectionDelta: 0 },
} as const;

function createFood(params: {
  id: string;
  slotId: number;
  foodLevel: 0 | 1 | 2 | 3;
  name: string;
  description: string;
}): FoodItem {
  const effect = levelEffect[params.foodLevel];
  return {
    id: params.id,
    characterId: "mock-character",
    slotId: params.slotId,
    foodLevel: params.foodLevel,
    displayOrder: params.slotId,
    name: params.name,
    iconPath: null,
    energyDelta: effect.energyDelta,
    affectionDelta: effect.affectionDelta,
    category: `${params.foodLevel}级食物`,
    rarity: params.foodLevel === 3 ? "legendary" : params.foodLevel === 2 ? "rare" : "common",
    description: params.description,
    enabled: true,
    count: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export const DEFAULT_FOODS: FoodItem[] = [
  createFood({
    id: "food_slot_1",
    slotId: 1,
    foodLevel: 0,
    name: "调试苦瓜",
    description: "0级食物：恢复 5 点能量，但会减少 2 点好感。",
  }),
  createFood({
    id: "food_slot_2",
    slotId: 2,
    foodLevel: 1,
    name: "数据饼干",
    description: "1级食物：恢复 2 点能量。",
  }),
  createFood({
    id: "food_slot_3",
    slotId: 3,
    foodLevel: 1,
    name: "像素糖",
    description: "1级食物：恢复 2 点能量。",
  }),
  createFood({
    id: "food_slot_4",
    slotId: 4,
    foodLevel: 1,
    name: "小电池",
    description: "1级食物：恢复 2 点能量。",
  }),
  createFood({
    id: "food_slot_5",
    slotId: 5,
    foodLevel: 2,
    name: "能量模块",
    description: "2级食物：恢复 5 点能量。",
  }),
  createFood({
    id: "food_slot_6",
    slotId: 6,
    foodLevel: 2,
    name: "代码曲奇",
    description: "2级食物：恢复 5 点能量。",
  }),
  createFood({
    id: "food_slot_7",
    slotId: 7,
    foodLevel: 2,
    name: "内存果冻",
    description: "2级食物：恢复 5 点能量。",
  }),
  createFood({
    id: "food_slot_8",
    slotId: 8,
    foodLevel: 2,
    name: "云同步包",
    description: "2级食物：恢复 5 点能量。",
  }),
  createFood({
    id: "food_slot_9",
    slotId: 9,
    foodLevel: 3,
    name: "星核便当",
    description: "3级食物：恢复 10 点能量。",
  }),
].map((food) => ({ ...food }));
