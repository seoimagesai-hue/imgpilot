import {describe, expect, it} from "vitest";
import {
  computeGuestResizeTarget,
  defaultGuestResizeOptions,
  GUEST_RESIZE_OPERATION,
  GUEST_RESIZE_PRESET_BOX,
  parseGuestResizeOptions,
} from "@/lib/guest/resize-policy";
import {isGuestSupportedOperation} from "@/server/guest/processing-policy";

describe("guest resize policy", () => {
  it("registers resize.same_format", () => {
    expect(GUEST_RESIZE_OPERATION).toBe("resize.same_format");
    expect(isGuestSupportedOperation(GUEST_RESIZE_OPERATION)).toBe(true);
  });

  it("defaults to website fit_inside with aspect + no upscale", () => {
    const d = defaultGuestResizeOptions();
    expect(d.method).toBe("fit_inside");
    expect(d.preset).toBe("website");
    expect(d.width).toBe(GUEST_RESIZE_PRESET_BOX.website.width);
    expect(d.height).toBe(GUEST_RESIZE_PRESET_BOX.website.height);
    expect(d.maintainAspectRatio).toBe(true);
    expect(d.preventUpscale).toBe(true);
  });

  it("resizes by width with aspect ratio", () => {
    const target = computeGuestResizeTarget(2000, 1000, {
      method: "by_width",
      width: 1000,
      height: null,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "custom",
    });
    expect(target).toEqual({width: 1000, height: 500, scaled: true});
  });

  it("resizes by height with aspect ratio", () => {
    const target = computeGuestResizeTarget(2000, 1000, {
      method: "by_height",
      width: null,
      height: 400,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "custom",
    });
    expect(target).toEqual({width: 800, height: 400, scaled: true});
  });

  it("fits inside a box without enlarging", () => {
    const target = computeGuestResizeTarget(1920, 1080, {
      method: "fit_inside",
      width: 1080,
      height: 1080,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "social",
    });
    expect(target.width).toBeLessThanOrEqual(1080);
    expect(target.height).toBeLessThanOrEqual(1080);
    expect(target.width).toBe(1080);
    expect(target.height).toBe(608);
    expect(target.scaled).toBe(true);
  });

  it("prevents upscale when target is larger than source", () => {
    const target = computeGuestResizeTarget(800, 600, {
      method: "by_width",
      width: 1600,
      height: null,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "custom",
    });
    expect(target).toEqual({width: 800, height: 600, scaled: false});
  });

  it("fit_inside does not upscale small sources", () => {
    const target = computeGuestResizeTarget(400, 300, {
      method: "fit_inside",
      width: 1920,
      height: 1080,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "website",
    });
    expect(target).toEqual({width: 400, height: 300, scaled: false});
  });

  it("keeps aspect when both dimensions would clamp unevenly", () => {
    const target = computeGuestResizeTarget(1000, 500, {
      method: "by_width",
      width: 2000,
      height: null,
      maintainAspectRatio: true,
      preventUpscale: true,
      preset: "custom",
    });
    expect(target.width / target.height).toBeCloseTo(2, 5);
    expect(target.width).toBeLessThanOrEqual(1000);
    expect(target.height).toBeLessThanOrEqual(500);
  });

  it("applies named presets via parseGuestResizeOptions", () => {
    const social = parseGuestResizeOptions({preset: "thumbnail", method: "fit_inside"});
    expect(social.width).toBe(GUEST_RESIZE_PRESET_BOX.thumbnail.width);
    expect(social.height).toBe(GUEST_RESIZE_PRESET_BOX.thumbnail.height);
    expect(social.preventUpscale).toBe(true);
    expect(social.maintainAspectRatio).toBe(true);
  });
});
