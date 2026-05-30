import { describe, expect, it } from "vitest";
import { createBounds, PET_VISUAL_GROUND_OFFSET } from "../systems/physics/engine";

describe("physics bounds", () => {
  it("places the sprite box on the taskbar edge when frames have no bottom padding", () => {
    const bounds = createBounds(1920, 1080, 40);

    expect(bounds.bottom).toBe(1080 - 40 + PET_VISUAL_GROUND_OFFSET);
  });

  it("does not place the pet below the physical screen when the taskbar is hidden", () => {
    const bounds = createBounds(1920, 1080, 0);

    expect(bounds.bottom).toBe(1080);
  });
});
