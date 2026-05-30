import { convertFileSrc } from "@tauri-apps/api/core";
import type { RickAnimationState } from "../stateMachine/types";

export interface FrameResolveInput {
  state: RickAnimationState;
  skinId: string;
  frameAssetsPath?: string | null;
  frameIndex: number;
}

const KEY_ALIAS: Record<string, string> = {};

export function resolveFrameUrlForKey({
  stateKey,
  skinId,
  frameAssetsPath,
  frameIndex,
}: Omit<FrameResolveInput, "state"> & { stateKey: string }): string {
  const folderKey = KEY_ALIAS[stateKey] ?? stateKey;
  const normalizedFrame = String(Math.max(1, frameIndex)).padStart(4, "0");

  if (frameAssetsPath) {
    const base = frameAssetsPath.replace(/[\\/]+$/, "");
    return convertFileSrc(`${base}/${folderKey}/${folderKey}_${normalizedFrame}.png`);
  }

  return `/assets/skins/${skinId}/${folderKey}/${folderKey}_${normalizedFrame}.png`;
}

export function resolveFrameUrl({ state, skinId, frameAssetsPath, frameIndex }: FrameResolveInput): string {
  return resolveFrameUrlForKey({ stateKey: state.key, skinId, frameAssetsPath, frameIndex });
}

export const FALLBACK_FRAME_URL = "/assets/skins/rick_default/calm/calm_0001.png";
