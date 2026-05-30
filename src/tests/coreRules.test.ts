import { describe, expect, it } from "vitest";
import { createMockBootstrap } from "../storage/database/mockData";
import { settleDailyAffection } from "../systems/affection/affection";
import { clampEnergy, applyEnergyDelta } from "../systems/energy/energy";
import { applyFeed, getFoodEffect, validateFoodReplacement, validateSlotId } from "../systems/food/foodRules";
import { resetStatsOnly } from "../systems/settings/resetRules";
import { validateSkinManifest } from "../systems/skin/skinValidator";
import { createRuntimeState, resolveExpiredState, transitionTo } from "../systems/stateMachine/runtime";
import { getAnimationState } from "../systems/stateMachine/stateDefinitions";

describe("affection settlement rules", () => {
  it("low affection active day gains 2 plus high-energy bonus", () => {
    const result = settleDailyAffection({ affection: 40, energyBeforeReset: 60, hadActivity: true });
    expect(result.affection).toBe(44);
  });

  it("high affection inactive day loses 10 plus low-energy penalty", () => {
    const result = settleDailyAffection({ affection: 80, energyBeforeReset: 20, hadActivity: false });
    expect(result.affection).toBe(68);
  });
});

describe("energy and food rules", () => {
  it("clamps energy to 0-100", () => {
    expect(clampEnergy(-5)).toBe(0);
    expect(applyEnergyDelta(95, 25)).toBe(100);
  });

  it("keeps exactly 9 valid food slots", () => {
    expect(validateSlotId(1)).toBe(true);
    expect(validateSlotId(9)).toBe(true);
    expect(validateSlotId(10)).toBe(false);
  });

  it("uses fixed level effects", () => {
    expect(getFoodEffect(0)).toEqual({ energyDelta: 5, affectionDelta: -2 });
    expect(getFoodEffect(1)).toEqual({ energyDelta: 2, affectionDelta: 0 });
    expect(getFoodEffect(2)).toEqual({ energyDelta: 5, affectionDelta: 0 });
    expect(getFoodEffect(3)).toEqual({ energyDelta: 10, affectionDelta: 0 });
  });

  it("requires png or svg when replacing food", () => {
    expect(validateFoodReplacement("新食物", "data:image/png;base64,abc").valid).toBe(true);
    expect(validateFoodReplacement("新食物", "data:image/jpeg;base64,abc").valid).toBe(false);
  });

  it("applies level-based feed effects", () => {
    const payload = createMockBootstrap();
    const food = { ...payload.foods[0], count: 1 };
    const result = applyFeed({ food, stats: payload.stats });

    expect(result.triggeredStateKey).toBe("feed_neutral");
    expect(result.stats.energy).toBe(65);
    expect(result.stats.affection).toBe(38);
  });
});

describe("state machine rules", () => {
  it("lets higher priority states interrupt lower priority states", () => {
    const calm = createRuntimeState("calm", 1000);
    const next = transitionTo(calm, "happy", 1100);
    expect(next.definition.key).toBe("happy");
  });

  it("keeps locked thinking from being interrupted by happy", () => {
    const thinking = createRuntimeState("thinking", 1000);
    const next = transitionTo(thinking, "happy", 1200);
    expect(next.definition.key).toBe("thinking");
  });

  it("returns one-shot animation to fallback after it expires", () => {
    const happy = createRuntimeState(getAnimationState("happy"), 1000);
    const resolved = resolveExpiredState(happy, "calm", 8000);
    expect(resolved.definition.key).toBe("calm");
  });
});

describe("skin and reset rules", () => {
  it("blocks skin import when manifest is missing", () => {
    const report = validateSkinManifest(null);
    expect(report.valid).toBe(false);
    expect(report.issues[0]?.code).toBe("ASSET_MANIFEST_MISSING");
  });

  it("cheat reset only restores energy and affection", () => {
    const payload = createMockBootstrap();
    const reset = resetStatsOnly(payload);

    expect(reset.stats.energy).toBe(60);
    expect(reset.stats.affection).toBe(40);
    expect(reset.messages).toHaveLength(payload.messages.length);
    expect(reset.characters).toHaveLength(payload.characters.length);
    expect(reset.foods).toHaveLength(payload.foods.length);
  });
});
