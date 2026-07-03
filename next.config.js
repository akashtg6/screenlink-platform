const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  // Renamed from experimental.serverComponentsExternalPackages in Next 15
  // - `mongodb` needs to run in Node runtime (not bundled).
  // - `@react-pdf/renderer` pulls in a `_document`/`_app` chain that conflicts
  //   with the App Router page-collection phase. Externalising it keeps the
  //   library on the client-only bundle (it's only ever `await import()`ed).
  // - `exceljs` similarly has native fs polyfills that break server tracing.
  serverExternalPackages: ['mongodb', '@react-pdf/renderer', 'exceljs', 'konva', 'react-konva'],
  webpack(config, { dev, isServer }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    // konva's `index-node.js` imports the native `canvas` package which is
    // only used for headless rendering \u2014 we never do that. Alias it to `false`
    // on both server and client so webpack doesn't try to resolve it.
    config.resolve = config.resolve || {}
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false }
    if (isServer) {
      // Extra safety: keep konva out of the server bundle entirely.
      config.externals = [...(config.externals || []), 'konva', 'react-konva']
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
