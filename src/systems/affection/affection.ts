import { PET_RULES } from "../../config/petRules";
import { clamp } from "../../utils/clamp";

export function clampAffection(affection: number): number {
  return clamp(affection, PET_RULES.AFFECTION_MIN, PET_RULES.AFFECTION_MAX);
}

export function settleDailyAffection(params: {
  affection: number;
  energyBeforeReset: number;
  hadActivity: boolean;
}): { affection: number; delta: number } {
  const startingAffection = clampAffection(params.affection);
  const activeDelta =
    startingAffection <= PET_RULES.DAILY_LOW_AFFECTION_THRESHOLD
      ? params.hadActivity
        ? PET_RULES.DAILY_LOW_ACTIVE_GAIN
        : -PET_RULES.DAILY_LOW_INACTIVE_DECAY
      : params.hadActivity
        ? PET_RULES.DAILY_HIGH_ACTIVE_GAIN
        : -PET_RULES.DAILY_HIGH_INACTIVE_DECAY;

  const energy = clamp(params.energyBeforeReset, PET_RULES.ENERGY_MIN, PET_RULES.ENERGY_MAX);
  const energyDelta =
    energy < PET_RULES.DAILY_LOW_ENERGY_THRESHOLD
      ? PET_RULES.DAILY_LOW_ENERGY_AFFECTION_DELTA
      : energy > PET_RULES.DAILY_HIGH_ENERGY_THRESHOLD
        ? PET_RULES.DAILY_HIGH_ENERGY_AFFECTION_DELTA
        : 0;

  const affection = clampAffection(startingAffection + activeDelta + energyDelta);
  return { affection, delta: affection - startingAffection };
}
