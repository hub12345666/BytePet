import generated from "../../config/animationStates.generated.json";
import type { RickAnimationState } from "./types";
import { SHORT_ACTION_DURATION_MS } from "../movement/constants";

interface GeneratedStateConfig {
  source: string;
  count: number;
  states: RickAnimationState[];
}

const config = generated as GeneratedStateConfig;

export const ANIMATION_STATE_SOURCE = config.source;
export const ANIMATION_STATES: RickAnimationState[] = config.states;

const stateMap = new Map(ANIMATION_STATES.map((state) => [state.key, state]));

export function isShortActionKey(key: string): boolean {
  return /^action\d+$/i.test(key);
}

function createShortActionState(key: string): RickAnimationState {
  return {
    layer: "L2",
    key,
    name: `短动作 ${key.replace(/^action/i, "")}`,
    category: "IdleAction",
    frames: 6,
    fps: 4,
    loop: true,
    priority: 25,
    triggerType: "IdleShortAction",
    trigger: "普通待机池抽中短动作",
    guard: "",
    durationMs: SHORT_ACTION_DURATION_MS,
    interruptible: true,
    locked: false,
    fallback: "calm",
    promptEnabled: false,
    promptMood: "",
    signalLight: "",
    assetPath: `assets/skins/{skinId}/${key}/${key}_0001.png…${key}_0006.png`,
    missingResourceFallback: "calm",
    notes: "短动作池动态动作，循环播放 8 秒后回到普通待机行为池。",
  };
}

export function getAnimationState(key: string): RickAnimationState {
  if (isShortActionKey(key)) {
    return createShortActionState(key.toLowerCase());
  }
  return stateMap.get(key) ?? stateMap.get("calm") ?? ANIMATION_STATES[0];
}

export function getRequiredStateKeys(): string[] {
  return ANIMATION_STATES.map((state) => state.key);
}

export function getBaseMoodStates(): RickAnimationState[] {
  return ANIMATION_STATES.filter((state) => state.category === "BaseMood");
}
