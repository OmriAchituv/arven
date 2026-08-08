import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  // Contexts are consumed as TypeScript source, not built artefacts, so the
  // package boundary stays a real edge without a build step between them.
  transpilePackages: ["@arven/db", "@arven/ui", "@arven/nutrition"],
  // Pin the workspace root — an unrelated lockfile in the home directory would
  // otherwise be inferred as the root.
  outputFileTracingRoot: path.join(here, "../.."),
};

export default config;
