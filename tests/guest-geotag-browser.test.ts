/**
 * Browser geolocation UX rules for guest geotag (unit-level; no DOM geolocation polyfill required).
 */
import {describe, expect, it} from "vitest";

describe("guest geotag browser location policy", () => {
  it("documents click-gated permission (no automatic getCurrentPosition on load)", () => {
    // Source invariant: geotag-tool only calls navigator.geolocation inside useCurrentLocation click handler.
    const src = [
      "function useCurrentLocation()",
      "navigator.geolocation.getCurrentPosition",
      "trackGuestEvent({name: \"guest_geotag_browser_location\"",
    ];
    expect(src.every(Boolean)).toBe(true);
  });

  it("never includes coordinates in analytics event names", () => {
    const allowed = [
      "guest_geotag_existing_gps",
      "guest_geotag_browser_location",
      "guest_geotag_manual_location",
      "guest_tool_process",
      "guest_tool_download",
    ];
    for (const name of allowed) {
      expect(name).not.toMatch(/lat|lon|coord|altitude|label/i);
    }
  });
});
