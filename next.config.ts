import type { NextConfig } from "next";

const stubModules = [
  "@solana/kit",
  "@solana-program/system",
  "@solana-program/token",
];

const turbopackAliases: Record<string, string> = {};
const webpackAliases: Record<string, string> = {};

for (const mod of stubModules) {
  turbopackAliases[mod] = "./stubs/empty.js";
  webpackAliases[mod] = require.resolve("./stubs/empty.js");
}

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? process.env.NEXT_PUBLIC_BASE_PATH ?? "" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: turbopackAliases,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "encoding");
    config.resolve.alias = {
      ...config.resolve.alias,
      ...webpackAliases,
    };
    return config;
  },
};

export default nextConfig;
