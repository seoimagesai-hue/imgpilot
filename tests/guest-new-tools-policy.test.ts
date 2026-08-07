import {describe, expect, it} from "vitest";
import {parseGuestRotateOptions} from "@/lib/guest/rotate-policy";
import {parseGuestWatermarkOptions} from "@/lib/guest/watermark-policy";
import {parseGuestBlurRegionOptions} from "@/lib/guest/blur-region-policy";
import {parseGuestMemeOptions} from "@/lib/guest/meme-policy";

describe("new guest transform policies", () => {
  it("parses rotate options", () => {
    expect(parseGuestRotateOptions({angle: 90, flipHorizontal: true, flipVertical: false})).toEqual({
      angle: 90,
      flipHorizontal: true,
      flipVertical: false,
    });
    expect(() => parseGuestRotateOptions({angle: 45})).toThrow();
  });

  it("parses watermark options", () => {
    expect(
      parseGuestWatermarkOptions({text: "Demo", position: "center", opacity: 0.4}),
    ).toMatchObject({text: "Demo", position: "center", opacity: 0.4});
    expect(() => parseGuestWatermarkOptions({text: "", position: "center", opacity: 0.4})).toThrow();
  });

  it("parses blur region options", () => {
    const parsed = parseGuestBlurRegionOptions({
      region: {x: 0.1, y: 0.2, width: 0.3, height: 0.4},
      strength: "strong",
    });
    expect(parsed.strength).toBe("strong");
    expect(parsed.region.width).toBeCloseTo(0.3);
    expect(() =>
      parseGuestBlurRegionOptions({region: {x: 0.9, y: 0.9, width: 0.5, height: 0.5}, strength: "medium"}),
    ).toThrow();
  });

  it("parses meme options", () => {
    expect(parseGuestMemeOptions({topText: "hello", bottomText: ""})).toEqual({
      topText: "hello",
      bottomText: "",
    });
    expect(() => parseGuestMemeOptions({topText: "", bottomText: ""})).toThrow();
  });
});
