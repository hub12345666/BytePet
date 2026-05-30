import {
  WALK_LEFT_KEY,
  WALK_RIGHT_KEY,
  FALL_KEY,
  IDLE_KEY,
  SIT_KEY,
  WALK_SPEED,
  IDLE_MIN_DURATION,
  IDLE_MAX_DURATION,
  WALK_TO_IDLE_CHANCE,
  FLIP_CHANCE,
  IDLE_TO_WALK_CHANCE,
  IDLE_TO_SIT_CHANCE,
  IDLE_TO_CALM_CHANCE,
  IDLE_TO_SHORT_ACTION_CHANCE,
  POST_MOVE_SIT_CHANCE,
} from "./constants";

export type MovementType = "idle" | "walk_left" | "walk_right" | "fall" | "drag" | "thrown";

export interface MovementState {
  type: MovementType;
  animationKey: string;
  direction: -1 | 1;
  idleTimer: number; // remaining ms in idle state
}

function nextIdleDuration(): number {
  return IDLE_MIN_DURATION + Math.random() * (IDLE_MAX_DURATION - IDLE_MIN_DURATION);
}

function choosePostMoveIdleKey(): string {
  return Math.random() < POST_MOVE_SIT_CHANCE ? SIT_KEY : IDLE_KEY;
}

function chooseShortActionKey(shortActionKeys: string[]): string {
  return shortActionKeys[Math.floor(Math.random() * shortActionKeys.length)] ?? IDLE_KEY;
}

export function createInitialMovementState(): MovementState {
  return {
    type: "fall",
    animationKey: FALL_KEY,
    direction: 1,
    idleTimer: 0,
  };
}

/**
 * Called when the pet lands on the ground (taskbar).
 * Transitions from fall to walk.
 */
export function onLanded(_current: MovementState): MovementState {
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    type: direction === 1 ? "walk_right" : "walk_left",
    animationKey: direction === 1 ? WALK_RIGHT_KEY : WALK_LEFT_KEY,
    direction,
    idleTimer: 0,
  };
}

/**
 * Tick the movement behavior. Called every MOVEMENT_TICK_MS.
 * Returns a new MovementState if a transition should happen, or null to keep current.
 * @param chatOpen - Whether the chat panel is open (locks movement)
 * @param aiBusy - Whether AI is responding (locks movement)
 */
export function tickMovement(
  current: MovementState,
  dtMs: number,
  chatOpen = false,
  aiBusy = false,
  shortActionKeys: string[] = []
): MovementState | null {
  // Don't transition during fall/drag/thrown - those are externally controlled
  if (current.type === "fall" || current.type === "drag" || current.type === "thrown") {
    return null;
  }

  // Lock movement when chat is open or AI is busy
  if (chatOpen || aiBusy) {
    return null;
  }

  // Idle state: count down timer, then choose a quiet behavior most of the time.
  if (current.type === "idle") {
    const remaining = current.idleTimer - dtMs;
    if (remaining <= 0) {
      const roll = Math.random();
      if (roll < IDLE_TO_WALK_CHANCE) {
        const flip = Math.random() < 0.3;
        const newDir = flip ? (current.direction * -1 as -1 | 1) : current.direction;
        return {
          type: newDir === 1 ? "walk_right" : "walk_left",
          animationKey: newDir === 1 ? WALK_RIGHT_KEY : WALK_LEFT_KEY,
          direction: newDir,
          idleTimer: 0,
        };
      }

      const sitThreshold = IDLE_TO_WALK_CHANCE + IDLE_TO_SIT_CHANCE;
      if (roll < sitThreshold) {
        return {
          type: "idle",
          animationKey: SIT_KEY,
          direction: current.direction,
          idleTimer: nextIdleDuration(),
        };
      }

      const calmThreshold = sitThreshold + IDLE_TO_CALM_CHANCE;
      if (roll < calmThreshold || shortActionKeys.length === 0) {
        return {
          type: "idle",
          animationKey: IDLE_KEY,
          direction: current.direction,
          idleTimer: nextIdleDuration(),
        };
      }

      const shortActionThreshold = calmThreshold + IDLE_TO_SHORT_ACTION_CHANCE;
      return {
        type: "idle",
        animationKey: roll < shortActionThreshold ? chooseShortActionKey(shortActionKeys) : IDLE_KEY,
        direction: current.direction,
        idleTimer: nextIdleDuration(),
      };
    }
    return { ...current, idleTimer: remaining };
  }

  // Walking state: random chance to stop and idle (only calm, not yawn/happy)
  if (current.type === "walk_left" || current.type === "walk_right") {
    if (Math.random() < WALK_TO_IDLE_CHANCE) {
      return {
        type: "idle",
        animationKey: choosePostMoveIdleKey(),
        direction: current.direction,
        idleTimer: nextIdleDuration(),
      };
    }

    // Random direction flip while walking
    if (Math.random() < FLIP_CHANCE) {
      const newDir = (current.direction * -1) as -1 | 1;
      return {
        type: newDir === 1 ? "walk_right" : "walk_left",
        animationKey: newDir === 1 ? WALK_RIGHT_KEY : WALK_LEFT_KEY,
        direction: newDir,
        idleTimer: 0,
      };
    }
  }

  return null; // no transition
}

/**
 * Called when pet hits a left or right wall.
 * Flips direction (no climbing).
 */
export function onHitWall(current: MovementState, side: "left" | "right"): MovementState {
  const newDir: -1 | 1 = side === "left" ? 1 : -1;
  if (current.type === "walk_left" || current.type === "walk_right") {
    return {
      type: newDir === 1 ? "walk_right" : "walk_left",
      animationKey: newDir === 1 ? WALK_RIGHT_KEY : WALK_LEFT_KEY,
      direction: newDir,
      idleTimer: 0,
    };
  }
  return { ...current, direction: newDir };
}

/**
 * Get the walk speed for the current direction.
 */
export function getWalkVelocity(direction: -1 | 1): number {
  return direction * WALK_SPEED;
}
