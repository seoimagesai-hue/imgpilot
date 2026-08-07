import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow verify builds without overwriting a live `.next` (e.g. NEXT_DIST_DIR=.next-phase1-verify).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Sharp is a native Node module — must not run on Edge.
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      {
        // Prefixed locales: /es/geotag-image, /ar/geotag-image, …
        source: "/:locale/geotag-image",
        headers: [
          {
            key: "Permissions-Policy",
            // Geolocation only after explicit click; IP geolocation is never used.
            value: "geolocation=(self)",
          },
        ],
      },
      {
        // English unprefixed: /geotag-image
        source: "/geotag-image",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self)",
          },
        ],
      },
    ];
  },
});
