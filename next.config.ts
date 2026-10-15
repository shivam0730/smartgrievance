// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   turbopack: { root: process.cwd() },
// };

// export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   serverExternalPackages: [
//     "@prisma/client",
//     "@prisma/adapter-pg",
//     "pg",
//     "@clerk/nextjs",
//     "prisma",
//   ],
//   turbopack: {
//     resolveAlias: {
//       ".prisma/client/default": "./node_modules/.prisma/client/default.js",
//     },
//   },
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "prisma",
  ],
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
};

export default nextConfig;