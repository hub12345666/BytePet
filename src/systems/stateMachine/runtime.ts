import { getAnimationState } from "./stateDefinitions";
import type { RickAnimationState, RuntimeAnimationState } from "./types";

export function createRuntimeState(
  definitionOrKey: RickAnimationState | string,
  now = Date.now()
): RuntimeAnimationState {
  const definition = typeof definitionOrKey === "string" ? getAnimationState(definitionOrKey) : definitionOrKey;
  const expiresAt = definition.durationMs > 0 ? now + definition.durationMs : null;

  return {
    definition,
    startedAt: now,
    expiresAt,
    locked: definition.locked
  };
}

export function isExpired(current: RuntimeAnimationState, now = Date.now()): boolean {
  return current.expiresAt !== null && now >= current.expiresAt;
}

export function canOverride(
  current: RuntimeAnimationState,
  next: RickAnimationState,
  now = Date.now()
): boolean {
  if (isExpired(current, now)) {
    return true;
  }

  if (current.locked && next.priority <= current.definition.priority) {
    return false;
  }

  if (next.priority > current.definition.priority) {
    return true;
  }

  if (next.priority === current.definition.priority && current.definition.interruptible) {
    return true;
  }

  return false;
}

export function transitionTo(
  current: RuntimeAnimationState,
  nextKey: string,
  now = Date.now()
): RuntimeAnimationState {
  const next = getAnimationState(nextKey);
  return canOverride(current, next, now) ? createRuntimeState(next, now) : current;
}

export function resolveExpiredState(
  current: RuntimeAnimationState,
  baseMoodKey = "calm",
  now = Date.now()
): RuntimeAnimationState {
  if (!isExpired(current, now)) {
    return current;
  }

  const fallback = current.definition.fallback || baseMoodKey || "calm";
  const fallbackKey = fallback === "currentBaseMood" ? baseMoodKey : fallback;
  return createRuntimeState(fallbackKey, now);
}

export function selectVisibleState(
  candidates: RickAnimationState[],
  current: RuntimeAnimationState,
  now = Date.now()
): RuntimeAnimationState {
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const next = sorted[0];

  if (!next) {
    return resolveExpiredState(current, "calm", now);
  }

  return canOverride(current, next, now) ? createRuntimeState(next, now) : resolveExpiredState(current, "calm", now);
}

