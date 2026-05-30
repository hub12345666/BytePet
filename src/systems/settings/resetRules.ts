import { PET_RULES } from "../../config/petRules";
import type { BootstrapPayload } from "../../types/domain";

export function resetStatsOnly(payload: BootstrapPayload): BootstrapPayload {
  return {
    ...payload,
    stats: {
      ...payload.stats,
      energy: PET_RULES.ENERGY_DEFAULT,
      affection: PET_RULES.AFFECTION_DEFAULT,
      updatedAt: new Date().toISOString(),
    },
  };
}
