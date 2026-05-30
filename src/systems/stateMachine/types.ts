export type RickStateLayer = "L1" | "L2" | "L3" | "L4" | "L5";

export type RickStateCategory =
  | "BaseMood"
  | "IdleAction"
  | "Reaction"
  | "AIAction"
  | "Interaction"
  | "ControlAction"
  | "SystemState"
  | "SpecialState"
  | "SpecialAction";

export interface RickAnimationState {
  layer: RickStateLayer;
  key: string;
  name: string;
  category: RickStateCategory;
  frames: number;
  fps: number;
  loop: boolean;
  priority: number;
  triggerType: string;
  trigger: string;
  guard: string;
  durationMs: number;
  interruptible: boolean;
  locked: boolean;
  fallback: string;
  promptEnabled: boolean;
  promptMood: string;
  signalLight: string;
  assetPath: string;
  missingResourceFallback: string;
  notes: string;
}

export interface RuntimeAnimationState {
  definition: RickAnimationState;
  startedAt: number;
  expiresAt: number | null;
  locked: boolean;
}

export interface StateMachineSnapshot {
  current: RuntimeAnimationState;
  baseMoodKey: string;
}

