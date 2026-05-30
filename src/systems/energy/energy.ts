import { clamp } from "../../utils/clamp";

export function clampEnergy(energy: number): number {
  return clamp(energy, 0, 100);
}

export function applyEnergyDelta(energy: number, delta: number): number {
  return clampEnergy(energy + delta);
}

