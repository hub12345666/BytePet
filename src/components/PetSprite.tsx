import { useEffect, useRef, useState } from "react";
import { resolveFrameUrl, resolveFrameUrlForKey, FALLBACK_FRAME_URL } from "../systems/animation/frameResolver";
import type { RuntimeAnimationState } from "../systems/stateMachine/types";

interface PetSpriteProps {
  currentState: RuntimeAnimationState;
  skinId: string;
  frameAssetsPath?: string | null;
  displayScale?: number;
  position: { x: number; y: number };
  onDragStart: (offsetX: number, offsetY: number) => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (velocityX: number, velocityY: number) => void;
}

export function PetSprite({
  currentState,
  skinId,
  frameAssetsPath,
  displayScale = 1,
  position,
  onDragStart,
  onDrag,
  onDragEnd,
}: PetSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(1);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_FRAME_URL);
  const definition = currentState.definition;
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const failedFrameUrlsRef = useRef(new Set<string>());
  const safeDisplayScale = Math.min(3, Math.max(0.75, Number.isFinite(displayScale) ? displayScale : 1));
  const visualSize = Math.round(PET_DISPLAY_SIZE * safeDisplayScale);
  const visualOffsetX = Math.round((visualSize - PET_DISPLAY_SIZE) / 2);
  const visualOffsetY = PET_DISPLAY_SIZE - visualSize;

  const resolveCurrentCharacterCalmUrl = (index: number) =>
    resolveFrameUrlForKey({
      stateKey: "calm",
      skinId,
      frameAssetsPath,
      frameIndex: Math.min(Math.max(1, index), 6),
    });

  const getDisplayFrameUrl = (url: string, index: number) => {
    if (!failedFrameUrlsRef.current.has(url)) {
      return url;
    }
    const calmUrl = resolveCurrentCharacterCalmUrl(index);
    return failedFrameUrlsRef.current.has(calmUrl) ? FALLBACK_FRAME_URL : calmUrl;
  };

  useEffect(() => {
    failedFrameUrlsRef.current.clear();
  }, [skinId, frameAssetsPath]);

  // Frame animation
  useEffect(() => {
    setFrameIndex(1);
    const firstFrameUrl = resolveFrameUrl({ state: definition, skinId, frameAssetsPath, frameIndex: 1 });
    setImgSrc(getDisplayFrameUrl(firstFrameUrl, 1));

    const scaleFrameMultiplier = safeDisplayScale > 1 ? 1 + (safeDisplayScale - 1) * 0.35 : 1;
    const baseIntervalMs = Math.max(80, Math.round(1000 / definition.fps));
    const durationSafeIntervalMs =
      !definition.loop && definition.durationMs > 0 && definition.frames > 1
        ? Math.max(80, Math.floor((definition.durationMs - 80) / (definition.frames - 1)))
        : Number.POSITIVE_INFINITY;
    const intervalMs = Math.min(
      durationSafeIntervalMs,
      Math.max(80, Math.round(baseIntervalMs * scaleFrameMultiplier))
    );
    let timer: number | null = null;
    if (definition.frames <= 1) {
      return undefined;
    }

    timer = window.setInterval(() => {
      setFrameIndex((frame) => {
        const nextFrame = frame + 1;
        if (nextFrame <= definition.frames) {
          return nextFrame;
        }
        if (!definition.loop && timer !== null) {
          window.clearInterval(timer);
          timer = null;
        }
        return definition.loop ? 1 : definition.frames;
      });
    }, intervalMs);

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [definition.key, definition.fps, definition.frames, definition.loop, definition.durationMs, currentState.startedAt, skinId, frameAssetsPath, safeDisplayScale]);

  // Update image source when frame changes
  useEffect(() => {
    const url = resolveFrameUrl({ state: definition, skinId, frameAssetsPath, frameIndex });
    setImgSrc(getDisplayFrameUrl(url, frameIndex));
  }, [definition, skinId, frameAssetsPath, frameIndex]);

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>): void {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = event.clientX - position.x;
    const offsetY = event.clientY - position.y;

    dragOffsetRef.current = { x: offsetX, y: offsetY };
    lastMouseRef.current = { x: event.clientX, y: event.clientY, time: Date.now() };
    draggingRef.current = true;
    onDragStart(offsetX, offsetY);

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;

      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      onDrag(newX, newY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Calculate release velocity
      const elapsed = Date.now() - lastMouseRef.current.time;
      const dt = Math.max(elapsed, 1);
      const velocityX = (e.clientX - lastMouseRef.current.x) / dt * 1000;
      const velocityY = (e.clientY - lastMouseRef.current.y) / dt * 1000;

      onDragEnd(velocityX, velocityY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  // 不做 CSS 翻转，方向由 run_left/run_right 动画文件夹决定
  const flipStyle = "scaleX(1)";

  return (
    <div
      ref={containerRef}
      className="pet-sprite-area pointer-events-auto absolute z-10 flex flex-col items-center overflow-visible"
      style={{
        left: `${position.x - PET_DISPLAY_SIZE / 2}px`,
        top: `${position.y}px`,
        width: `${PET_DISPLAY_SIZE}px`,
        height: `${PET_DISPLAY_SIZE}px`,
      }}
      data-interactive="true"
    >
      <div
        className="absolute cursor-grab bg-white/[0.001] active:cursor-grabbing"
        style={{
          left: `${-visualOffsetX}px`,
          top: `${visualOffsetY}px`,
          width: `${visualSize}px`,
          height: `${visualSize}px`,
          transform: flipStyle,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={(event) => event.preventDefault()}
        data-interactive="true"
      >
        <img
          className="h-full w-full object-contain"
          src={imgSrc}
          alt="BytePet"
          draggable={false}
          onError={() => {
            failedFrameUrlsRef.current.add(imgSrc);
            const calmUrl = resolveCurrentCharacterCalmUrl(frameIndex);
            setImgSrc(imgSrc === calmUrl || failedFrameUrlsRef.current.has(calmUrl) ? FALLBACK_FRAME_URL : calmUrl);
          }}
        />
      </div>
    </div>
  );
}

const PET_DISPLAY_SIZE = 152;
